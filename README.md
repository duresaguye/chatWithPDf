# PDF Q&A with AI

An intelligent PDF question-answering system that uses AI to analyze PDF documents and answer questions about their content. Built with FastAPI, React, and Google's Gemini AI.

## Features

- 📄 PDF document upload and processing
- 🤖 AI-powered question answering using Google's Gemini
- 🔍 Semantic search using ChromaDB
- 💬 Interactive chat interface
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔒 Secure file handling and processing

## Tech Stack

### Backend
- FastAPI (Python web framework)
- ChromaDB (Vector database for semantic search)
- Google Gemini AI (LLM for answer generation)
- PyPDF2 (PDF text extraction)
- Sentence Transformers (Text embeddings)

### Frontend
- React with TypeScript
- React Router (Navigation)
- Tailwind CSS (Styling)
- shadcn/ui (UI components)
- Vite (Build tool)

## Prerequisites

- Python 3.8+
- Node.js 16+
- Google Gemini API key
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/duresaguye/chatWithPDf
cd chatwithPdf
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

4. Create a `.env` file in the backend directory:
```env
GEMINI_API_KEY=your_gemini_api_key
ALLOWED_ORIGINS=http://localhost:5173
```

## Running the Application

1. Start the backend server:
```bash
cd backend
uvicorn main:app --reload
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Upload a PDF document (max size: 2MB)
2. Wait for the document to be processed
3. Ask questions about the document's content
4. View AI-generated answers with source references

## API Endpoints

- `POST /upload`: Upload and process a PDF file
- `POST /ask`: Ask a question about the uploaded PDF

## Project Structure

```
pdf-qa/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── PDFUploadPage.tsx
│   │   │   └── QAPage.tsx
│   │   ├── components/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

