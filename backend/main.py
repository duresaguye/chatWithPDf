import os
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, status, BackgroundTasks, Body
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
import shutil
from fastapi.responses import FileResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# System resource limits

MAX_PDF_SIZE = 5 * 1024 * 1024  # 5MB
MAX_PAGES = 50
MAX_TEXT_LENGTH = 100000  
MAX_CHUNKS = 50 
CHUNK_SIZE = 1000 
OVERLAP = 200 

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
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
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

UPLOAD_DIR = "./uploaded_pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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

class SummarizeRequest(BaseModel):
    pdf_id: str
    page: Optional[int] = None
    whole: Optional[bool] = False

class SummarizeResponse(BaseModel):
    summary: str

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
    model = genai.GenerativeModel('gemini-2.0-flash')
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

        # Save original PDF for later viewing
        pdf_id = str(uuid.uuid4())
        pdf_path = os.path.join(UPLOAD_DIR, f"{pdf_id}.pdf")
        with open(pdf_path, "wb") as f:
            f.write(content)

        # Process PDF with PyPDF2
        text = extract_text_from_pdf(content)

        if not text:
            raise HTTPException(400, "Could not extract text from PDF")

        # Generate chunks
        chunks = chunk_text(text)
        if not chunks:
            raise HTTPException(400, "Could not chunk text")

        # Prepare metadata
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

@app.get("/pdf/{pdf_id}")
def get_pdf(pdf_id: str):
    pdf_path = os.path.join(UPLOAD_DIR, f"{pdf_id}.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(404, "PDF not found")
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"{pdf_id}.pdf")


@app.post("/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    try:
        check_system_resources()
        
        # Retrieve relevant chunks (increased to 5 for better context)
        results = pdf_collection.query(
            query_texts=[request.question],
            n_results=5,
            where={"pdf_id": request.pdf_id} if request.pdf_id else None,
            include=["distances", "metadatas", "documents"]
        )
        
        documents = results["documents"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0]
        
        if not documents:
            # If no relevant chunks found in the PDF
            return AnswerResponse(
                answer="I couldn't find any relevant information about this in your document. "
                      "This appears to be outside the scope of the uploaded PDF.",
                sources=[],
                confidence=0.0
            )
        
        # Improved prompt with better structure and instructions
        context = "\n\n".join([
            f"DOCUMENT EXTRACT {i+1}:\n{text}\n"
            for i, text in enumerate(documents[:5])
        ])
        
        prompt = f"""You are an expert document analyst. Carefully analyze the following extracts from a PDF document to answer the user's question.

DOCUMENT EXTRACTS:
{context}

USER QUESTION: {request.question}

INSTRUCTIONS:
1. Provide a clear, concise answer using ONLY the document extracts
2. If the information isn't in the document, say: "The document doesn't specifically mention this, but generally..."
3. For technical terms, provide simple explanations when possible
4. If completely unrelated to the document, say: "This appears unrelated to your document"
5. Never invent details not present in the document

ANSWER:"""
        
        response = model.generate_content(prompt)
        
        # Determine if answer came from document or is general knowledge
        answer_text = response.text
        sources = []
        confidence = 0.0
        
        if any(keyword in answer_text.lower() for keyword in ["doesn't mention", "unrelated", "generally"]):
            # Answer is not from document
            confidence = 0.0
        else:
            # Answer is from document
            sources = list(set([
                meta['filename']
                for meta in metadatas[:3]  # Show top 3 sources max
            ]))
            
            # Calculate confidence score (normalized to 0-1 range)
            if distances:
                avg_distance = sum(distances[:3]) / 3
                confidence = max(0, min(1, 1 - (avg_distance / 2)))  # Normalize
                confidence = round(confidence, 2)
        
        return AnswerResponse(
            answer=answer_text,
            sources=sources,
            confidence=confidence
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Question processing failed: {str(e)}", exc_info=True)
        raise HTTPException(500, f"Question processing failed: {str(e)}")

@app.post("/summarize", response_model=SummarizeResponse)
async def summarize_pdf(request: SummarizeRequest = Body(...)):
    try:
        check_system_resources()
        pdf_path = os.path.join(UPLOAD_DIR, f"{request.pdf_id}.pdf")
        if not os.path.exists(pdf_path):
            raise HTTPException(404, "PDF not found")
        with open(pdf_path, "rb") as f:
            content = f.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        if request.whole:
            # Summarize the whole document (up to MAX_PAGES)
            text = ""
            for i, page in enumerate(pdf_reader.pages):
                if i >= MAX_PAGES:
                    break
                page_text = page.extract_text() or ""
                if len(text) + len(page_text) > MAX_TEXT_LENGTH:
                    break
                text += page_text + "\n"
            if not text:
                raise HTTPException(400, "Could not extract text from PDF")
        elif request.page is not None:
            # Summarize a specific page
            if request.page < 1 or request.page > len(pdf_reader.pages):
                raise HTTPException(400, "Invalid page number")
            page = pdf_reader.pages[request.page - 1]
            text = page.extract_text() or ""
            if not text:
                raise HTTPException(400, "Could not extract text from the specified page")
        else:
            raise HTTPException(400, "Specify either 'whole' or 'page'")
        # Summarize with Gemini
        prompt = f"""
Summarize the following PDF content in 3-5 concise, clear bullet points. Focus on the main ideas and key information. Use plain language.

CONTENT:
{text}

SUMMARY (3-5 bullet points):
"""
        response = model.generate_content(prompt)
        summary = response.text.strip()
        return SummarizeResponse(summary=summary)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Summarization failed: {str(e)}", exc_info=True)
        raise HTTPException(500, f"Summarization failed: {str(e)}")

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