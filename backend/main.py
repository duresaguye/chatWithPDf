import os
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
from chromadb.utils import embedding_functions
import uuid
import PyPDF2  
import io
from typing import List, Optional
from dotenv import load_dotenv
import psutil
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# System resource limits
MAX_PDF_SIZE = 2 * 1024 * 1024  # 2MB
MAX_PAGES = 20
MAX_TEXT_LENGTH = 50000  # characters
MAX_CHUNKS = 30
CHUNK_SIZE = 500
OVERLAP = 100

# Configure Gemini (lazy loaded later)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI(
    title="PDF QA System with Gemini",
    version="1.0.0",
    docs_url=None if os.getenv("ENV") == "production" else "/docs"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Initialize ChromaDB with optimized settings
client = chromadb.PersistentClient(
    path="./chroma_db",
    settings=chromadb.Settings(
        anonymized_telemetry=False,
        allow_reset=True,
        is_persistent=True,
        persist_directory="./chroma_db"
    )
)

# Lazy loaded components
model = None
sentence_transformer_ef = None
pdf_collection = None

class QuestionRequest(BaseModel):
    question: str
    pdf_id: Optional[str] = None

class AnswerResponse(BaseModel):
    answer: str
    sources: List[str]
    confidence: float

class UploadResponse(BaseModel):
    pdf_id: str
    filename: str
    num_chunks: int

def check_system_resources():
    """Check if system has enough resources to proceed"""
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    if mem.available < 1 * 1024 * 1024 * 1024:  # Less than 1GB RAM
        logger.warning(f"Low memory available: {mem.available/1024/1024:.2f}MB")
        raise HTTPException(503, "Server memory low, please try again later")
    if disk.free < 1 * 1024 * 1024 * 1024:  # Less than 1GB disk space
        logger.warning(f"Low disk space: {disk.free/1024/1024:.2f}MB")
        raise HTTPException(503, "Insufficient disk space")

def chunk_text(text: str) -> List[str]:
    """Efficient text chunking with boundary checks"""
    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length and len(chunks) < MAX_CHUNKS:
        end = min(start + CHUNK_SIZE, text_length)
        chunk = text[start:end]
        chunks.append(chunk)
        start = max(0, end - OVERLAP)  # Prevent negative start index
    
    return chunks

def extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF using PyPDF2 with memory limits"""
    text = ""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        for i, page in enumerate(pdf_reader.pages):
            if i >= MAX_PAGES:
                break
            page_text = page.extract_text() or ""
            if len(text) + len(page_text) > MAX_TEXT_LENGTH:
                break
            text += page_text + "\n"
    except Exception as e:
        raise HTTPException(400, f"PDF processing failed: {str(e)}")
    return text

@app.on_event("startup")
async def startup_event():
    """Lazy load heavy components"""
    global model, sentence_transformer_ef, pdf_collection
    
    # Load embedding function
    sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2",
        device="cpu"  # Force CPU usage
    )
    
    # Initialize collection
    pdf_collection = client.get_or_create_collection(
        name="pdf_documents",
        embedding_function=sentence_transformer_ef
    )
    
    # Load Gemini model
    model = genai.GenerativeModel('models/gemini-1.5-pro-002')
    logger.info("Server started with all components loaded")

@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    user_id: str = Form(None),
    background_tasks: BackgroundTasks = None
):
    try:
        check_system_resources()
        
        # Validate file size
        content = await file.read()
        if len(content) > MAX_PDF_SIZE:
            raise HTTPException(400, f"PDF too large. Max size is {MAX_PDF_SIZE/1024/1024}MB")

        # Process PDF with PyPDF2
        text = extract_text_from_pdf(content)

        if not text:
            raise HTTPException(400, "Could not extract text from PDF")

        # Generate chunks
        chunks = chunk_text(text)
        if not chunks:
            raise HTTPException(400, "Could not chunk text")

        # Prepare metadata
        pdf_id = str(uuid.uuid4())
        filename = file.filename

        # Prepare documents for ChromaDB
        documents_to_add = chunks[:MAX_CHUNKS]
        metadatas_to_add = [{
            "pdf_id": pdf_id,
            "filename": filename,
            "chunk_id": i,
            "user_id": user_id or "anonymous"
        } for i in range(len(documents_to_add))]
        ids_to_add = [f"{pdf_id}_chunk_{i}" for i in range(len(documents_to_add))]

        # Add to ChromaDB collection
        pdf_collection.add(
            documents=documents_to_add,
            metadatas=metadatas_to_add,
            ids=ids_to_add
        )

        logger.info(f"Uploaded PDF {filename} with {len(chunks)} chunks")
        return UploadResponse(pdf_id=pdf_id, filename=filename, num_chunks=len(chunks))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}", exc_info=True)
        raise HTTPException(500, f"PDF upload failed: {str(e)}")

@app.post("/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    try:
        check_system_resources()
        
        # Retrieve relevant chunks (limited to 3 for lower memory usage)
        results = pdf_collection.query(
            query_texts=[request.question],
            n_results=3,
            where={"pdf_id": request.pdf_id} if request.pdf_id else None,
            include=["distances", "metadatas", "documents"]
        )
        
        documents = results["documents"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0]
        
        if not documents:
            return AnswerResponse(
                answer="No relevant information found",
                sources=[],
                confidence=0.0
            )
        
        # Generate answer using Gemini with limited context
        context = "\n\n".join(documents[:3])
        prompt = f"""Answer the question based on this context:
        {context}
        
        Question: {request.question}
        
        Provide a concise answer using only the provided context. 
        If unsure, say "I couldn't find a definitive answer in the document".
        """
        
        response = model.generate_content(prompt)
        
        # Format sources
        sources = [
            f"{meta['filename']} (Chunk {meta['chunk_id']})"
            for meta in metadatas[:3]
        ]
        
        # Calculate confidence score
        confidence = 1 - (sum(distances[:3]) / 3) if distances else 0.0
        
        return AnswerResponse(
            answer=response.text,
            sources=sources,
            confidence=round(confidence, 2)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Question processing failed: {str(e)}", exc_info=True)
        raise HTTPException(500, f"Question processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        workers=1,
        limit_max_requests=100,
        timeout_keep_alive=30
    )