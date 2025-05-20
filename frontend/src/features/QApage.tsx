"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Send, FileText, User, Bot } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function QAPage() {
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    // Add user message to chat
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
      // Send question to API
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      })

      if (!response.ok) {
        throw new Error("Failed to get answer")
      }

      const data = await response.json()

      // Add assistant message to chat
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.answer,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError("Failed to get an answer. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-3xl h-[80vh] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">PDF Q&A</CardTitle>
              <CardDescription>Ask questions about your uploaded PDF</CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.push("/")}>
              <FileText className="mr-2 h-4 w-4" />
              Upload New PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bot className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p>Ask a question about your PDF to get started</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      {message.role === "user" ? (
                        <>
                          <span className="font-medium">You</span>
                          <User className="ml-1 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <Bot className="mr-1 h-4 w-4" />
                          <span className="font-medium">Assistant</span>
                        </>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                  <div className="flex items-center">
                    <Bot className="mr-1 h-4 w-4" />
                    <span className="font-medium">Assistant</span>
                  </div>
                  <div className="flex items-center mt-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <form onSubmit={handleSubmit} className="w-full flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your PDF..."
              disabled={loading}
              className="flex-grow"
            />
            <Button type="submit" disabled={loading || !question.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  )
}
