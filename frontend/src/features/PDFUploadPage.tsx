import { useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle, Upload, FileText, X, Loader2, Rocket } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { API_ENDPOINTS } from "@/config"

export default function PDFUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const navigate = useNavigate()

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    validateAndSetFile(selectedFile)
  }

  const validateAndSetFile = (file: File | undefined) => {
    if (file && file.type === "application/pdf") {
      setFile(file)
      setUploadStatus("idle")
      setErrorMessage("")
    } else {
      setFile(null)
      setErrorMessage("Please select a valid PDF file")
      setUploadStatus("error")
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    validateAndSetFile(droppedFile)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    setUploadStatus("idle")

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        return prev + 5
      })
    }, 200)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("user_id", "anonymous")

      const response = await fetch(API_ENDPOINTS.upload, {
        method: "POST",
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
        credentials: 'include',
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Upload failed" }))
        throw new Error(errorData.detail || "Upload failed")
      }

      const data = await response.json()
      setUploadProgress(100)
      setUploadStatus("success")

      // Redirect to Q&A page after successful upload
      setTimeout(() => {
        navigate("/qa", { state: { pdfId: data.pdf_id } })
      }, 1500)
    } catch (error) {
      clearInterval(progressInterval)
      setUploadStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload the PDF. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md border-0 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col items-center space-y-2">
            <Rocket className="h-8 w-8 text-blue-600" />
            <CardTitle className="text-2xl font-bold text-gray-800">Upload Your PDF</CardTitle>
            <CardDescription className="text-center text-gray-500">
              Upload a document to start asking AI-powered questions
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div 
            className={`flex flex-col items-center justify-center rounded-xl p-8 cursor-pointer transition-all ${
              isDragging 
                ? 'border-2 border-dashed border-blue-400 bg-blue-50' 
                : 'border-2 border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50'
            }`}
            onClick={() => document.getElementById('pdf-upload')?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="pdf-upload"
              disabled={uploading}
            />
            <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center space-y-3">
              <div className="p-3 rounded-full bg-blue-100">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-700">
                  {isDragging ? 'Drop your PDF here' : 'Click to browse or drag & drop'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Supports PDF files up to 2MB</p>
              </div>
            </label>
          </div>

          {file && (
            <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <FileText className="h-5 w-5 text-blue-600 mr-3" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button 
                onClick={() => setFile(null)} 
                disabled={uploading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {uploading && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing document...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress 
                value={uploadProgress} 
                className="h-2 bg-gray-200"
                indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-500"
              />
            </div>
          )}

          {uploadStatus === "success" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <AlertTitle className="text-green-800">Upload Complete!</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your document is being processed. You'll be redirected shortly...
                </AlertDescription>
              </div>
            </Alert>
          )}

          {uploadStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <div>
                <AlertTitle>Upload Failed</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </div>
            </Alert>
          )}

          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600  hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-4">
                <Rocket className="h-4 w-4" />
                Analyze with AI
              </span>
            )}
          </Button>

          <div className="text-center text-xs text-gray-500 pt-2">
            Your files are processed securely and never stored permanently
          </div>
        </CardContent>
      </Card>
    </main>
  )
}