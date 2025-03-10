'use client'

import { useState } from "react"
import { Upload, BarChart, PieChart, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

const VISUALIZATION_TYPES = [
  { value: "connections", label: "Connection Growth", icon: BarChart },
  { value: "countries", label: "Connection Countries", icon: Globe },
  { value: "roles", label: "Top Roles", icon: PieChart },
]

export function DataAnalyzer() {
  const [linkedinData, setLinkedinData] = useState(null)
  const [selectedViz, setSelectedViz] = useState("connections")

  const handleDataUpload = async (file) => {
    // Handle LinkedIn data upload and parsing
  }

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">Analyze Your Network</h2>

        {!linkedinData ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => handleDataUpload(e.target.files[0])}
              className="hidden"
              id="linkedin-data"
            />
            <label 
              htmlFor="linkedin-data"
              className="cursor-pointer space-y-4 block"
            >
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  Upload your LinkedIn data export
                </p>
                <p className="text-sm text-muted-foreground">
                  We'll analyze your connections and provide insights
                </p>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex gap-4">
              {VISUALIZATION_TYPES.map(viz => (
                <Button
                  key={viz.value}
                  variant={selectedViz === viz.value ? "default" : "outline"}
                  onClick={() => setSelectedViz(viz.value)}
                  className="flex gap-2"
                >
                  <viz.icon className="w-4 h-4" />
                  {viz.label}
                </Button>
              ))}
            </div>

            <div className="h-[400px] border rounded-lg p-4">
              {/* Visualization will be rendered here */}
              {/* Use a charting library like recharts or chart.js */}
            </div>
          </div>
        )}
      </div>
    </section>
  )
} 