import os
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
from chromadb.utils import embedding_functions
import uuid
import PyPDF2
import io
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-pro')

app = FastAPI(title="PDF QA System with Gemini", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
# Initialize ChromaDB with Sentence Transformers embeddings
client = chromadb.PersistentClient(path="./chroma_db")
sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

pdf_collection = client.get_or_create_collection(
    name="pdf_documents",
    embedding_function=sentence_transformer_ef
)

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

# Keep the same chunk_text and extract_text_from_pdf functions

@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    chunk_size: int = Form(1000),
    overlap: int = Form(200)
):
    try:
        # Read the PDF content
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page_num in range(len(pdf_reader.pages)):
            text += pdf_reader.pages[page_num].extract_text() or ""

        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        # Generate a unique PDF ID
        pdf_id = str(uuid.uuid4())
        filename = file.filename

        # Chunk the text
        # Simple chunking for now - can be improved
        # This basic implementation just splits the text into chunks of chunk_size with overlap
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += chunk_size - overlap
            # Ensure start doesn't go backwards if overlap > chunk_size
            if start < 0:
                start = 0


        if not chunks:
             raise HTTPException(status_code=400, detail="Could not chunk text")


        # Prepare documents for ChromaDB
        documents_to_add = []
        metadatas_to_add = []
        ids_to_add = []

        for i, chunk in enumerate(chunks):
            documents_to_add.append(chunk)
            metadatas_to_add.append({
                "pdf_id": pdf_id,
                "filename": filename,
                "chunk_id": i
            })
            ids_to_add.append(f"{pdf_id}_chunk_{i}")

        # Add to ChromaDB collection
        pdf_collection.add(
            documents=documents_to_add,
            metadatas=metadatas_to_add,
            ids=ids_to_add
        )

        return UploadResponse(pdf_id=pdf_id, filename=filename, num_chunks=len(chunks))

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF upload failed: {str(e)}"
        )

@app.post("/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    try:
        # Retrieve relevant chunks
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
            return AnswerResponse(
                answer="No relevant information found",
                sources=[],
                confidence=0.0
            )
        
        # Generate answer using Gemini
        context = "\n\n".join(documents)
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
            for meta in metadatas
        ]
        
        # Calculate confidence score
        confidence = 1 - (sum(distances) / len(distances)) if distances else 0.0
        
        return AnswerResponse(
            answer=response.text,
            sources=sources,
            confidence=round(confidence, 2)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Question processing failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)