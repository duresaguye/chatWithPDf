import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, ArrowLeft, ChevronLeft, ChevronRight, FileText, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QAPage = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Assume pdfId is passed via location.state or query param
  const pdfId = location.state?.pdfId || new URLSearchParams(window.location.search).get('pdfId');

  useEffect(() => {
    if (pdfId) {
      setPdfUrl(`/api/pdf/${pdfId}`);
    }
  }, [pdfId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    const userMessage: Message = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);
    try {
      const response = await axios.post('/api/ask', {
        question: question,
        pdf_id: pdfId,
      });
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.answer,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSummary = async (type: 'page' | 'whole') => {
    if (!pdfId) return;
    setSummaryLoading(true);
    setSummary(null);
    try {
      const response = await axios.post('/api/summarize', {
        pdf_id: pdfId,
        page: type === 'page' ? pageNumber : undefined,
        whole: type === 'whole',
      });
      setSummary(response.data.summary);
    } catch (error) {
      setSummary('Failed to generate summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
          {/* PDF Viewer Side */}
          <div className="md:w-1/2 w-full bg-white rounded-lg shadow p-4 flex flex-col items-center">
            <div className="flex items-center mb-4 gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-800">PDF Preview</span>
            </div>
            {pdfUrl ? (
              <>
                <div className="border rounded-lg overflow-hidden w-full flex flex-col items-center bg-gray-50">
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    loading={<div className="p-8 text-gray-400">Loading PDF...</div>}
                  >
                    <Page pageNumber={pageNumber} width={350} />
                  </Document>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {pageNumber} of {numPages || '?'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                    disabled={pageNumber >= numPages}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-8 text-gray-400">No PDF loaded.</div>
            )}
            <div className="flex gap-2 mt-6 w-full justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSummary('page')}
                disabled={summaryLoading || !numPages}
                className="flex items-center"
              >
                <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                Summarize this page
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSummary('whole')}
                disabled={summaryLoading}
                className="flex items-center"
              >
                <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                Summarize whole document
              </Button>
            </div>
            {summaryLoading && (
              <div className="mt-4 text-blue-500 animate-pulse">Generating summary...</div>
            )}
            {summary && (
              <Card className="mt-6 w-full bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-lg">
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <Sparkles className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="font-semibold text-gray-800">AI Summary</span>
                  </div>
                  <div className="text-gray-700 whitespace-pre-line text-base">
                    {summary}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Chat Side */}
          <div className="md:w-1/2 w-full flex flex-col">
            <div className="flex items-center mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate('/upload')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Upload
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Chat with Your PDF</h1>
            </div>
            <Card className="p-6 mb-6 flex-1 flex flex-col">
              <div className="space-y-6 h-[60vh] overflow-y-auto mb-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        {message.role === 'assistant' ? (
                          <Bot className="h-4 w-4 mr-2" />
                        ) : (
                          <User className="h-4 w-4 mr-2" />
                        )}
                        <span className="font-medium">
                          {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex items-center">
                        <Bot className="h-4 w-4 mr-2" />
                        <span className="font-medium">AI Assistant</span>
                      </div>
                      <p>Thinking...</p>
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleSubmit} className="flex gap-4 mt-auto">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about your PDF..."
                  className="flex-1"
                  disabled={loading}
                />
                <Button type="submit" disabled={loading}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QAPage;