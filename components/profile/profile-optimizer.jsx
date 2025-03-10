'use client'
import { useState } from "react"
import { Upload, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

const OPTIMIZATION_GOALS = [
  { value: "recruiters", label: "Attract Recruiters" },
  { value: "clients", label: "Find New Clients" },
  { value: "networking", label: "Networking Opportunities" },
  { value: "speaking", label: "Speaking Engagements" },
  { value: "investors", label: "Connect with Investors" },
]

export function ProfileOptimizer() {
  const [goal, setGoal] = useState("")
  const [linkedinFile, setLinkedinFile] = useState(null)
  const [cvFile, setCvFile] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsAnalyzing(true)

    try {
      // Here you would implement the actual file upload and AI processing
      const formData = new FormData()
      formData.append('goal', goal)
      formData.append('linkedin', linkedinFile)
      formData.append('apiKey', localStorage.getItem('openai_api_key')); 
      if (cvFile) {
        formData.append('cv', cvFile)
      }

      // Mock API call - replace with your actual API endpoint
      // const response = await fetch('/api/analyze', {
      //   method: 'POST',
      //   body: formData
      // })
      // const data = await response.json()
      // setResults(data)

      // Mock response for now
      setTimeout(() => {
        setResults({
          suggestions: [
            "Your profile headline could be more impactful",
            "Add more quantifiable achievements",
            "Expand your skills section"
          ]
        })
        setIsAnalyzing(false)
      }, 2000)

    } catch (error) {
      console.error('Error analyzing profile:', error)
      setIsAnalyzing(false)
    }
  }

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-8 text-center">
            Let's Optimize Your LinkedIn Profile
          </h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="text-lg font-medium">What's your goal?</label>
              <select 
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full p-3 border rounded-lg bg-background"
                required
              >
                <option value="">Select your optimization goal...</option>
                {OPTIMIZATION_GOALS.map(goal => (
                  <option key={goal.value} value={goal.value}>
                    {goal.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-lg font-medium">LinkedIn Profile PDF</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setLinkedinFile(e.target.files[0])}
                    className="hidden"
                    id="linkedin-file"
                    required
                  />
                  <label 
                    htmlFor="linkedin-file"
                    className="cursor-pointer space-y-2 block"
                  >
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Upload your LinkedIn profile PDF
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-lg font-medium">CV/Resume (Optional)</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setCvFile(e.target.files[0])}
                    className="hidden"
                    id="cv-file"
                  />
                  <label 
                    htmlFor="cv-file"
                    className="cursor-pointer space-y-2 block"
                  >
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Upload your CV (Optional)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isAnalyzing || !goal || !linkedinFile}
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  Analyzing... <div className="animate-spin">⚡</div>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Analyze & Optimize <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 p-6 bg-card rounded-lg border"
            >
              <h3 className="text-xl font-semibold mb-4">Optimization Suggestions</h3>
              <ul className="space-y-3">
                {results.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
} 