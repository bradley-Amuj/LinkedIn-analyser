'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, BarChart2, Globe2, Users, Briefcase, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ResponsiveContainer, PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F']

const VISUALIZATION_TYPES = [
  { value: "connections", label: "Connection Growth", icon: BarChart2 },
  { value: "countries", label: "Connection Countries", icon: Globe2 },
  { value: "roles", label: "Top Roles", icon: Briefcase },
  { value: "industries", label: "Industries", icon: Users },
]

export function NetworkAnalysis() {
  const [linkedinData, setLinkedinData] = useState(null)
  const [selectedViz, setSelectedViz] = useState("connections")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/analyze/network', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      
      setLinkedinData(data)
    } catch (err) {
      setError('Failed to analyze network data')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const renderVisualization = () => {
    if (!linkedinData) return null

    switch (selectedViz) {
      case 'connections':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={linkedinData.connectionGrowth}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="connections" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'countries':
      case 'roles':
      case 'industries':
        const data = linkedinData[selectedViz]
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
    }
  }

  return (
    <div className="space-y-8">
      {!linkedinData ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload Network Data</CardTitle>
            <CardDescription>
              Upload your LinkedIn connections data export (.csv)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="network-data"
              />
              <label 
                htmlFor="network-data"
                className="cursor-pointer block space-y-4"
              >
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Upload Connections Data</p>
                  <p className="text-sm text-muted-foreground">
                    We'll analyze your network and provide insights
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Network Insights</CardTitle>
                  <CardDescription>
                    Analyze your professional network
                  </CardDescription>
                </div>
                <Select value={selectedViz} onValueChange={setSelectedViz}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select visualization" />
                  </SelectTrigger>
                  <SelectContent>
                    {VISUALIZATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedViz}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-h-[400px]"
                >
                  {renderVisualization()}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
              <CardDescription>
                AI-generated insights based on your network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {linkedinData.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <p>{insight}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="text-destructive p-4">
            {error}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 