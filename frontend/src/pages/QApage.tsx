import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send, FileText, User, Bot } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useNavigate, useLocation } from "react-router-dom"
import { API_ENDPOINTS } from "@/config"


const scrollbarStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: string[]
  confidence?: number
}

export default function QAPage() {
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const pdfId = location.state?.pdfId

  useEffect(() => {
    if (!pdfId) {
      navigate("/", { replace: true })
    }
  }, [pdfId, navigate])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || !pdfId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
    }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)
    setError("")
    setQuestion("")

    try {
      const response = await fetch(API_ENDPOINTS.ask, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          question,
          pdf_id: pdfId 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to get answer")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get an answer. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!pdfId) {
    return null
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50">
      <style>{scrollbarStyles}</style>
      <div className="w-full max-w-5xl h-screen flex flex-col">
        {/* Header */}
        <div className="border-b bg-white p-4 flex items-center justify-between pt-32 pb-6"> {/* Added pb-6 for bottom padding */}
  <div className="flex items-center space-x-2">
    <Bot className="h-6 w-6 text-gray-700" />
    <h1 className="text-lg font-semibold">PDF Assistant</h1>
  </div>
  <Button 
    variant="outline" 
    size="sm" 
    onClick={() => navigate("/")}
    className="flex items-center"
  >
    <FileText className="mr-2 h-4 w-4" />
    New PDF
  </Button>
</div>


        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <Bot className="h-10 w-10 mb-4" />
              <p className="text-lg">Ask me anything about your PDF document</p>
              <p className="text-sm mt-2">I'll help you analyze and understand its contents</p>
            </div>
          ) : (
            <div className="px-4 md:px-8">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-6`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl p-6 ${
                      message.role === "user" 
                        ? "bg-gray-800 text-white rounded-br-none" 
                        : "bg-gray-100 rounded-bl-none"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {message.role === "user" ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5 text-gray-700" />
                      )}
                      <span className="font-medium">
                        {message.role === "user" ? "You" : "Assistant"}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none px-1">
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                        <p className="font-medium">Source: {message.sources[0]}</p>
                        {message.confidence && (
                          <p>Confidence: {(message.confidence * 100).toFixed(0)}%</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-xl rounded-bl-none bg-gray-100 p-6">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-gray-700" />
                      <span className="font-medium">Assistant</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 px-1">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      <span className="text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-center">
                  <Alert variant="destructive" className="max-w-[80%]">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-white p-4">
          <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-3xl mx-auto">
            <Input
              value={question}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
              placeholder="Message PDF Assistant..."
              disabled={loading}
              className="flex-1 rounded-full"
            />
            <Button 
              type="submit" 
              disabled={loading || !question.trim()}
              size="icon"
              className="rounded-full h-10 w-10"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-2">
  Responses are based on the uploaded PDF content
</p>
        </div>
      </div>
    </main>
  )
}