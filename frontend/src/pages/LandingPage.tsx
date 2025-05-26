import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Brain,
  Search,
  MessageCircle,
  Upload,
  Zap,
  Shield,
  Smartphone,
  Github,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from "lucide-react"
import { Link } from "react-router-dom"

export default function PDFQALandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PDF Q&A AI
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="https://github.com/duresaguye/chatWithPDf" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            </a>
            <Link to="/upload">
              <Button size="sm">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by Google Gemini AI
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight">
            Chat with Your PDFs
            <br />
            <span className="text-blue-600">Intelligently</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Upload any PDF document and ask questions about its content. Our AI-powered system provides accurate answers
            with semantic search and source references.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/upload">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload PDF & Start
              </Button>
            </Link>
            <a href="https://github.com/duresaguye/chatWithPDf" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="px-8 py-3">
                <Github className="w-5 h-5 mr-2" />
                View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Powerful Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to extract insights from your PDF documents
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>PDF Processing</CardTitle>
                <CardDescription>
                  Upload and process PDF documents up to 5MB with advanced text extraction
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>AI-Powered Answers</CardTitle>
                <CardDescription>
                  Get intelligent responses using Google's Gemini AI with contextual understanding
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Semantic Search</CardTitle>
                <CardDescription>
                  Advanced vector search with ChromaDB for finding relevant content quickly
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Interactive Chat</CardTitle>
                <CardDescription>Engage in natural conversations about your document content</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle>Responsive Design</CardTitle>
                <CardDescription>Modern, mobile-friendly interface built with React and Tailwind CSS</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle>Secure Processing</CardTitle>
                <CardDescription>Safe file handling with secure processing and data protection</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Get answers from your PDFs in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">1. Upload PDF</h3>
              <p className="text-gray-600">
                Upload your PDF document and let our system extract and process the text content
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">2. Ask Questions</h3>
              <p className="text-gray-600">Type your questions about the document content in natural language</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">3. Get Answers</h3>
              <p className="text-gray-600">Receive intelligent answers with source references powered by AI</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Built with Modern Technology</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Powered by cutting-edge tools and frameworks</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl font-semibold mb-6 text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-blue-600 rounded mr-3"></div>
                Backend
              </h3>
              <div className="space-y-3">
                {[
                  "FastAPI - High-performance Python web framework",
                  "ChromaDB - Vector database for semantic search",
                  "Google Gemini AI - Advanced language model",
                  "PyPDF2 - PDF text extraction",
                  "Sentence Transformers - Text embeddings",
                ].map((tech, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{tech}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-6 text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-purple-600 rounded mr-3"></div>
                Frontend
              </h3>
              <div className="space-y-3">
                {[
                  "React with TypeScript - Modern UI framework",
                  "React Router - Client-side navigation",
                  "Tailwind CSS - Utility-first styling",
                  "shadcn/ui - Beautiful UI components",
                  "Vite - Fast build tool and dev server",
                ].map((tech, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{tech}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Chat with Your PDFs?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start extracting insights from your documents today with our AI-powered Q&A system
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="https://github.com/duresaguye/chatWithPDf" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="secondary" className="px-8 py-3 ">
                <Github className="w-5 h-5 mr-2" />
                View on GitHub
              </Button>
            </a>
            <Link to="/upload">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-3 text-gray-800 border-white hover:bg-white hover:text-blue-600"
              >
                <Upload className="w-5 h-5 mr-2  text-gray-800" />
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">PDF Q&A AI</span>
          </div>
          <p className="text-gray-400 mb-4">Intelligent PDF question-answering system powered by AI</p>
          <div className="flex justify-center space-x-6">
            <a href="https://github.com/duresaguye/chatWithPDf" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-800">
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            </a>
            <Link to="/upload">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-800">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
