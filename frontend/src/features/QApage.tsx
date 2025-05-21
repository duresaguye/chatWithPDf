"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Send, FileText, User, Bot } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useNavigate, useLocation } from "react-router-dom"
import { API_ENDPOINTS } from "@/config"

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
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-3xl h-[80vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">PDF Chat</CardTitle>
              <CardDescription>Ask questions about your document</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <FileText className="mr-2 h-4 w-4" />
              New PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <Bot className="h-8 w-8 mb-2" />
              <p>Ask your first question about the PDF</p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === "user" 
                      ? "bg-gray-800 text-white" 
                      : "bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 text-sm font-medium">
                    {message.role === "user" ? (
                      <>
                        <User className="h-4 w-4" />
                        You
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4" />
                        Assistant
                      </>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                      <p>Sources: {message.sources.join(", ")}</p>
                      {message.confidence && (
                        <p>Confidence: {(message.confidence * 100).toFixed(1)}%</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg p-3 bg-gray-100">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Bot className="h-4 w-4" />
                  Assistant
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing your question...</span>
                </div>
              </div>
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter className="border-t p-4">
          <form onSubmit={handleSubmit} className="w-full flex gap-2">
            <Input
              value={question}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
              placeholder="Type your question..."
              disabled={loading}
              className="flex-grow"
            />
            <Button 
              type="submit" 
              disabled={loading || !question.trim()}
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  )
}