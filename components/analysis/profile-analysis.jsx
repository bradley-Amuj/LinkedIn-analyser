'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, Loader2, AlertCircle, Check } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

const GOALS = [
  { value: "recruiters", label: "Attract Recruiters" },
  { value: "clients", label: "Find New Clients" },
  { value: "networking", label: "Networking Opportunities" },
  { value: "speaking", label: "Speaking Engagements" },
  { value: "investors", label: "Connect with Investors" },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export function ProfileAnalysis() {
  const [goal, setGoal] = useState("")
  const [linkedinFile, setLinkedinFile] = useState(null)
  const [cvFile, setCvFile] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState({
    linkedin: 0,
    cv: 0
  })

  const validateFile = (file) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Invalid File Type", {
        description: "Please upload a PDF or Word document"
      });
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File Too Large", {
        description: "Maximum file size is 10MB"
      });
      return false;
    }

    return true;
  }

  const handleFileChange = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file || !validateFile(file)) return;

    try {
      // Reset progress for this file type
      setUploadProgress(prev => ({...prev, [type]: 0}));

      // Simulate file upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev[type] + 20, 100);
          if (newProgress === 100) clearInterval(progressInterval);
          return {...prev, [type]: newProgress};
        });
      }, 200);

      // Convert file to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fileData = {
        name: file.name,
        content: base64
      };

      console.log("This is the form content",fileData)

      // Set file and ensure progress reaches 100%
      setTimeout(() => {
        setUploadProgress(prev => ({...prev, [type]: 100}));
        type === 'linkedin' ? setLinkedinFile(fileData) : setCvFile(fileData);
      }, 500);

    } catch (error) {
      console.error(`Error processing ${type} file:`, error);
      toast.error("File Processing Error", {
        description: `Could not process ${type} file`
      });
      setUploadProgress(prev => ({...prev, [type]: 0}));
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData()
      formData.append('goal', goal)
      formData.append('linkedinData', linkedinFile ? JSON.stringify(linkedinFile) : '')
      formData.append('apiKey', localStorage.getItem('openai_api_key')); 
      if (cvFile) formData.append('cvData', JSON.stringify(cvFile))

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed')
      }
      setAnalysis(data.analysis)
      toast.success("Profile Analysis Complete", {
        description: "Your personalized recommendations are ready!"
      });
    } catch (error) {
      setError(error.message || 'An unexpected error occurred')
      toast.error("Analysis Error", {
        description: error.message
      });
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Optimization</CardTitle>
          <CardDescription>
            Upload your LinkedIn profile and CV to get personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-medium">Select your goal</label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger aria-label="Select optimization goal">
                <SelectValue placeholder="What do you want to achieve?" />
              </SelectTrigger>
              <SelectContent>
                {GOALS.map((goal) => (
                  <SelectItem key={goal.value} value={goal.value}>
                    {goal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">LinkedIn Profile PDF</label>
              <div 
                className="border-2 border-dashed rounded-lg p-6 text-center relative"
                aria-label="LinkedIn profile upload area"
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'linkedin')}
                  className="hidden"
                  id="linkedin-file"
                  aria-describedby="linkedin-file-hint"
                />
                <label htmlFor="linkedin-file" className="cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <span 
                    id="linkedin-file-hint" 
                    className="text-sm text-muted-foreground"
                  >
                    {linkedinFile ? linkedinFile.name : 'Upload LinkedIn PDF'}
                  </span>
                </label>
                {uploadProgress.linkedin > 0 && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{width: `${uploadProgress.linkedin}%`}}
                    ></div>
                  </div>
                )}
                {linkedinFile && (
                  <div className="absolute top-2 right-2 text-green-500">
                    <Check className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">CV/Resume (Optional)</label>
              <div 
                className="border-2 border-dashed rounded-lg p-6 text-center relative"
                aria-label="CV upload area"
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, 'cv')}
                  className="hidden"
                  id="cv-file"
                  aria-describedby="cv-file-hint"
                />
                <label htmlFor="cv-file" className="cursor-pointer block">
                  <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <span 
                    id="cv-file-hint" 
                    className="text-sm text-muted-foreground"
                  >
                    {cvFile ? cvFile.name : 'Upload CV'}
                  </span>
                </label>
                {uploadProgress.cv > 0 && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{width: `${uploadProgress.cv}%`}}
                    ></div>
                  </div>
                )}
                {cvFile && (
                  <div className="absolute top-2 right-2 text-green-500">
                    <Check className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button 
            onClick={handleAnalyze}
            disabled={!goal || !linkedinFile || isAnalyzing}
            className="w-full"
            aria-label="Analyze profile"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Profile'
            )}
          </Button>

          {error && (
            <div 
              role="alert" 
              className="flex items-center text-destructive space-x-2 mt-4"
            >
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                {analysis}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}