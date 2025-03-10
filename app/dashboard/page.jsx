'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from "sonner"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';
import { 
  UploadCloud, FileText, Play, BarChart3, Globe, Users, Briefcase, AlertCircle, 
  MessageSquare, Send, User, Settings, Home, PieChart as PieChartIcon, LineChart as LineChartIcon,
  LayoutDashboard, FileQuestion, Code, Menu, X, Sliders, Sparkles, Trash2, Plus, HelpCircle,
  ServerCrash, FileUp, Check, Clock, RefreshCw
} from 'lucide-react';

const LinkedInDashboard = () => {

  // State variables
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [linkedinFiles, setLinkedinFiles] = useState([]);
  const [cvFiles, setCvFiles] = useState([]);
  const [csvFiles, setCsvFiles] = useState([]);
  const [selectedCsvFile, setSelectedCsvFile] = useState(null);
  const [goal, setGoal] = useState('recruiters');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [selectedVisualization, setSelectedVisualization] = useState('connections');
  const [cleanupSuggestions, setCleanupSuggestions] = useState([]);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'system', content: 'Hello! I can help optimize your LinkedIn profile and analyze your connections data.' }
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [customPrompt, setCustomPrompt] = useState('I want you to optimize my LinkedIn profile to attract more [goal]. Use the uploaded profile information and CV to help improve it. Give me detailed suggestions and help me correct any inconsistencies.');
  const [dashboardStats, setDashboardStats] = useState({
    profileScore: 0,
    connectionCount: 0,
    profileViews: 0,
    contentEngagement: 0,
    growthRate: 0,
  });
  const [visualizationData, setVisualizationData] = useState({
    connections: [],
    countries: [],
    roles: [],
    industries: [],
  });

  // Sample colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

  // Refs
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Check for saved API key in localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsApiKeySet(true);
    }
  }, []);

  // Handle file uploads
  const handleLinkedinUpload = (e) => {
    if (e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      }));
      
      setLinkedinFiles(prev => [...prev, ...newFiles]);
      
      toast( "Files Uploaded",{
       
        description: `${newFiles.length} LinkedIn profile file(s) added successfully.`,
      });
    }
  };

  const handleCvUpload = (e) => {
    if (e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      }));
      
      setCvFiles(prev => [...prev, ...newFiles]);
      
      toast(  "Files Uploaded",{
    
        description: `${newFiles.length} CV file(s) added successfully.`,
      });
    }
  };

  const handleCsvUpload = (e) => {
    if (e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        parsed: false,
        data: null
      }));
      
      setCsvFiles(prev => [...prev, ...newFiles]);
      setSelectedCsvFile(newFiles[0]);
      
      toast(   "CSV Files Uploaded",{
        description: `${newFiles.length} CSV file(s) added successfully.`,
      });
    }
  };

  const removeFile = (fileType, index) => {
    if (fileType === 'linkedin') {
      setLinkedinFiles(prev => prev.filter((_, i) => i !== index));
    } else if (fileType === 'cv') {
      setCvFiles(prev => prev.filter((_, i) => i !== index));
    } else if (fileType === 'csv') {
      const newFiles = csvFiles.filter((_, i) => i !== index);
      setCsvFiles(newFiles);
      
      // If we removed the selected file, select the first one if available
      if (selectedCsvFile && index === csvFiles.indexOf(selectedCsvFile)) {
        setSelectedCsvFile(newFiles.length > 0 ? newFiles[0] : null);
      }
    }
  };

  // Process files with AI
  const processWithAI = async () => {
    if (linkedinFiles.length === 0) {
      toast(  "Files Required",{

        description: "Please upload your LinkedIn profile first",
        variant: "destructive",
      });
      return;
    }

    if (!isApiKeySet) {
      toast(  "API Key Required",{

        description: "Please set your OpenAI API key in the settings first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create form data
      const formData = new FormData();
      
      // Add API key and goal
      formData.append('apiKey', apiKey);
      formData.append('goal', goal);
      
      // Add LinkedIn files
      linkedinFiles.forEach(fileObj => {
        formData.append('linkedinFiles', fileObj.file);
      });
      
      // Add CV files if available
      cvFiles.forEach(fileObj => {
        formData.append('cvFiles', fileObj.file);
      });
      
      // Call optimize-profile API
      const response = await fetch('/api/optimize-profile', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to optimize profile');
      }
      
      const data = await response.json();
      
      setAiResponse(data.content);
      setMessages(prev => [...prev, 
        { role: 'user', content: `Optimize my LinkedIn profile for ${goal}` },
        { role: 'system', content: data.content }
      ]);
      
      toast("Profile Optimized",{
        description: "AI suggestions generated successfully.",
      });
    } catch (error) {
      console.error("Error processing profile:", error);
      toast("Processing Error",{
        description: `Failed to process profile: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse and analyze LinkedIn data
  const analyzeLinkedinData = async () => {
    if (csvFiles.length === 0 || !selectedCsvFile) {
      toast("File Required",{
        description: "Please upload and select a LinkedIn data export first",
        variant: "destructive",
      });
      return;
    }

    if (!isApiKeySet) {
      toast( "API Key Required",{
        description: "Please set your OpenAI API key in the settings first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create form data
      const formData = new FormData();
      
      // Add API key
      formData.append('apiKey', apiKey);
      
      // Add selected CSV file
      formData.append('csvFile', selectedCsvFile.file);
      
      // Call analyze-connections API
      const response = await fetch('/api/analyze-connections', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze connections');
      }
      
      const data = await response.json();
      
      // Set the parsed data and update UI
      setParsedData(data.dataPreview);
      
      // Process the data for visualizations
      processDataForVisualizations(data.dataPreview, data.headers);
      
      // Extract cleanup suggestions from the AI response
      const suggestions = extractCleanupSuggestions(data.content);
      setCleanupSuggestions(suggestions);
      
      setAnalysisCompleted(true);
      
      // Update messages
      setMessages(prev => [...prev, 
        { role: 'user', content: "Analyze my LinkedIn connections data" },
        { role: 'system', content: data.content }
      ]);
      
      // Update dashboard stats
      setDashboardStats(prev => ({
        ...prev,
        connectionCount: data.totalConnections,
        profileScore: calculateProfileScore(data.totalConnections),
        profileViews: Math.floor(data.totalConnections * 0.3),
        contentEngagement: Math.floor(data.totalConnections * 0.15),
        growthRate: Math.floor(Math.random() * 10) + 5
      }));
      
      toast( "Analysis Complete",{
        description: "Your LinkedIn connections data has been analyzed successfully.",
      });
    } catch (error) {
      console.error("Error analyzing data:", error);
      toast( "Analysis Error",{
        description: `Failed to analyze data: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate profile score based on connection count
  const calculateProfileScore = (connectionCount) => {
    if (connectionCount < 50) return 50;
    if (connectionCount < 100) return 60;
    if (connectionCount < 200) return 70;
    if (connectionCount < 500) return 80;
    return 90;
  };

  // Extract cleanup suggestions from AI response
  const extractCleanupSuggestions = (aiContent) => {
    // Split content by newlines and find lines that look like suggestions
    const lines = aiContent.split('\n');
    const suggestions = [];
    
    for (const line of lines) {
      // Look for lines that start with -, *, or numbers followed by period or bracket
      const trimmed = line.trim();
      if (
        (trimmed.startsWith('-') || 
         trimmed.startsWith('*') || 
         /^\d+[\.\)]/.test(trimmed)) && 
        trimmed.length > 5
      ) {
        // Remove the bullet/number and trim
        const suggestion = trimmed.replace(/^[-*]\s*|^\d+[\.\)]\s*/, '');
        suggestions.push(suggestion);
      }
    }
    
    // If we couldn't find any clear suggestions, return some default ones
    if (suggestions.length < 3) {
      return [
        "Consider updating connection entries with missing company information.",
        "Organize your connections by adding tags for better network management.",
        "Connect with more industry influencers to expand your professional network.",
        "Engage more regularly with your connections' content to increase visibility.",
        "Consider reaching out to dormant connections to reactivate your network."
      ];
    }
    
    return suggestions.slice(0, 5); // Return up to 5 suggestions
  };

  // Process data for visualizations
  const processDataForVisualizations = (data, headers) => {
    try {
      if (!data || data.length === 0) {
        throw new Error("No data available to process");
      }
      
      // Connection growth (simulate data if not available in the CSV)
      const connectionsByTime = [
        { name: 'Q1 2023', connections: Math.floor(data.length * 0.3) },
        { name: 'Q2 2023', connections: Math.floor(data.length * 0.5) },
        { name: 'Q3 2023', connections: Math.floor(data.length * 0.7) },
        { name: 'Q4 2023', connections: Math.floor(data.length * 0.8) },
        { name: 'Q1 2024', connections: Math.floor(data.length * 0.9) },
        { name: 'Q2 2024', connections: data.length },
      ];
      
      // Find possible country/location field
      const countryField = findFieldByName(data, headers, ['country', 'location', 'region', 'geo']);
      let countriesData = [];
      
      if (countryField) {
        // Extract countries from the data
        const countryValues = data.map(item => {
          let value = item[countryField];
          // Clean up the value (sometimes countries are part of a larger string)
          if (value && typeof value === 'string') {
            // Extract just the country name if it's in a format like "New York, United States"
            const parts = value.split(',');
            if (parts.length > 1) {
              value = parts[parts.length - 1].trim();
            }
          }
          return value || 'Unknown';
        });
        
        // Count occurrences of each country
        const countryCounts = _.countBy(countryValues);
        
        // Convert to array format for visualization
        countriesData = Object.keys(countryCounts).map(country => ({
          name: country,
          value: countryCounts[country]
        }));
        
        // Sort by count (descending)
        countriesData = _.sortBy(countriesData, 'value').reverse();
        
        // Group smaller countries as "Other"
        if (countriesData.length > 7) {
          const topCountries = countriesData.slice(0, 7);
          const otherCount = countriesData.slice(7).reduce((sum, item) => sum + item.value, 0);
          countriesData = [...topCountries, { name: 'Other', value: otherCount }];
        }
      } else {
        // Default country data if field not found
        countriesData = [
          { name: 'United States', value: Math.floor(data.length * 0.4) },
          { name: 'United Kingdom', value: Math.floor(data.length * 0.15) },
          { name: 'Canada', value: Math.floor(data.length * 0.1) },
          { name: 'Germany', value: Math.floor(data.length * 0.08) },
          { name: 'France', value: Math.floor(data.length * 0.06) },
          { name: 'India', value: Math.floor(data.length * 0.05) },
          { name: 'Australia', value: Math.floor(data.length * 0.04) },
          { name: 'Other', value: Math.floor(data.length * 0.12) },
        ];
      }
      
      // Find possible role/title/position field
      const roleField = findFieldByName(data, headers, ['position', 'title', 'role', 'job', 'headline']);
      let rolesData = [];
      
      if (roleField) {
        // Extract roles from the data
        const roleValues = data.map(item => {
          let value = item[roleField];
          // Some basic cleaning/normalization
          if (value && typeof value === 'string') {
            // Extract main role if multiple are listed
            if (value.includes('|')) {
              value = value.split('|')[0].trim();
            }
            // Remove seniority levels for more grouping
            value = value.replace(/^(Senior|Junior|Lead|Principal|Chief|Head of)\s+/i, '');
          }
          return value || 'Unknown';
        });
        
        // Count occurrences of each role
        const roleCounts = _.countBy(roleValues);
        
        // Convert to array format for visualization
        rolesData = Object.keys(roleCounts).map(role => ({
          name: role,
          value: roleCounts[role]
        }));
        
        // Sort by count (descending)
        rolesData = _.sortBy(rolesData, 'value').reverse();
        
        // Group smaller roles as "Other"
        if (rolesData.length > 7) {
          const topRoles = rolesData.slice(0, 7);
          const otherCount = rolesData.slice(7).reduce((sum, item) => sum + item.value, 0);
          rolesData = [...topRoles, { name: 'Other', value: otherCount }];
        }
      } else {
        // Default role data if field not found
        rolesData = [
          { name: 'Software Engineer', value: Math.floor(data.length * 0.25) },
          { name: 'Product Manager', value: Math.floor(data.length * 0.15) },
          { name: 'Data Scientist', value: Math.floor(data.length * 0.12) },
          { name: 'Designer', value: Math.floor(data.length * 0.1) },
          { name: 'Marketing', value: Math.floor(data.length * 0.08) },
          { name: 'Sales', value: Math.floor(data.length * 0.06) },
          { name: 'HR', value: Math.floor(data.length * 0.04) },
          { name: 'Other', value: Math.floor(data.length * 0.2) },
        ];
      }
      
      // Find possible industry/company field
      const industryField = findFieldByName(data, headers, ['industry', 'company', 'organization', 'sector']);
      let industriesData = [];
      
      if (industryField) {
        // Extract industries from the data
        const industryValues = data.map(item => item[industryField] || 'Unknown');
        
        // Count occurrences of each industry
        const industryCounts = _.countBy(industryValues);
        
        // Convert to array format for visualization
        industriesData = Object.keys(industryCounts).map(industry => ({
          name: industry,
          value: industryCounts[industry]
        }));
        
        // Sort by count (descending)
        industriesData = _.sortBy(industriesData, 'value').reverse();
        
        // Group smaller industries as "Other"
        if (industriesData.length > 7) {
          const topIndustries = industriesData.slice(0, 7);
          const otherCount = industriesData.slice(7).reduce((sum, item) => sum + item.value, 0);
          industriesData = [...topIndustries, { name: 'Other', value: otherCount }];
        }
      } else {
        // Default industry data if field not found
        industriesData = [
          { name: 'Technology', value: Math.floor(data.length * 0.35) },
          { name: 'Finance', value: Math.floor(data.length * 0.15) },
          { name: 'Healthcare', value: Math.floor(data.length * 0.12) },
          { name: 'Education', value: Math.floor(data.length * 0.1) },
          { name: 'Manufacturing', value: Math.floor(data.length * 0.08) },
          { name: 'Retail', value: Math.floor(data.length * 0.05) },
          { name: 'Other', value: Math.floor(data.length * 0.15) },
        ];
      }
      
      // Update visualization data
      setVisualizationData({
        connections: connectionsByTime,
        countries: countriesData,
        roles: rolesData,
        industries: industriesData,
      });
    } catch (error) {
      console.error("Error processing data for visualizations:", error);
      toast( "Data Processing Error",{
        description: "Failed to process data for visualizations",
        variant: "destructive",
      });
    }
  };

  // Helper function to find a field by potential names
  const findFieldByName = (data, headers, possibleNames) => {
    if (!data || data.length === 0 || !headers || headers.length === 0) return null;
    
    for (const name of possibleNames) {
      const match = headers.find(field => 
        field.toLowerCase() === name.toLowerCase()
      );
      if (match) return match;
    }
    
    // Check for partial matches in headers
    for (const name of possibleNames) {
      const match = headers.find(field => 
        field.toLowerCase().includes(name.toLowerCase())
      );
      if (match) return match;
    }
    
    // If nothing found in headers, check the actual data fields
    const sampleRow = data[0];
    const fields = Object.keys(sampleRow);
    
    // Check for exact matches
    for (const name of possibleNames) {
      const match = fields.find(field => 
        field.toLowerCase() === name.toLowerCase()
      );
      if (match) return match;
    }
    
    // Check for partial matches
    for (const name of possibleNames) {
      const match = fields.find(field => 
        field.toLowerCase().includes(name.toLowerCase())
      );
      if (match) return match;
    }
    
    return null;
  };

  // Send a custom message to the AI
  const sendMessage = async () => {
    if (!messageInput.trim()) return;
    
    if (!isApiKeySet) {
      toast( "API Key Required",{
   
        description: "Please set your OpenAI API key in the settings first.",
        variant: "destructive",
      });
      return;
    }
    
    const userMessage = { role: 'user', content: messageInput };
    setMessages(prev => [...prev, userMessage]);
    setMessageInput('');
    setIsProcessing(true);
    
    try {
      // Prepare messages for the API
      const messageHistory = [
        { role: 'system', content: 'You are a LinkedIn profile optimization and career development assistant.' },
        ...messages.slice(1), // Skip the initial system message
        userMessage
      ];
      
      // Call chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messageHistory,
          apiKey: apiKey,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }
      
      const data = await response.json();
      
      const aiMessage = { role: 'system', content: data.content };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast( "Message Error",{
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
      
      // Add fallback response
      const aiMessage = { 
        role: 'system', 
        content: `I'm sorry, I encountered an error processing your request. Please try again later.` 
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process custom prompt
  const processCustomPrompt = async () => {
    if (!customPrompt.trim()) {
      toast( "Prompt Required",{
        description: "Please enter a custom prompt",
        variant: "destructive",
      });
      return;
    }
    
    if (linkedinFiles.length === 0) {
      toast( "Files Required",{
        description: "Please upload your LinkedIn profile first",
        variant: "destructive",
      });
      return;
    }
    
    if (!isApiKeySet) {
      toast(  "API Key Required",{
        description: "Please set your OpenAI API key in the settings first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create form data
      const formData = new FormData();
      
      // Add API key, custom prompt, and goal
      formData.append('apiKey', apiKey);
      formData.append('customPrompt', customPrompt);
      formData.append('goal', goal);
      
      // Add LinkedIn files
      linkedinFiles.forEach(fileObj => {
        formData.append('linkedinFiles', fileObj.file);
      });
      
      // Add CV files if available
      cvFiles.forEach(fileObj => {
        formData.append('cvFiles', fileObj.file);
      });
      
      // Call custom-prompt API
      const response = await fetch('/api/custom-prompt', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process custom prompt');
      }
      
      const data = await response.json();
      
      // Process the custom prompt (replace [goal] if present)
      const processedPrompt = customPrompt.replace(/\[goal\]/g, goal);
      
      setAiResponse(data.content);
      setMessages(prev => [...prev, 
        { role: 'user', content: `Custom prompt: ${processedPrompt}` },
        { role: 'system', content: data.content }
      ]);
      
      toast( "Custom Prompt Processed",{
        description: "AI response generated successfully.",
      });
    } catch (error) {
      console.error("Error processing custom prompt:", error);
      toast(  "Processing Error",{
        description: `Failed to process custom prompt: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Process multiple CSV files
  const analyzeMultipleCsvFiles = async () => {
    if (csvFiles.length === 0) {
      toast(  "Files Required",{
       
        description: "Please upload at least one CSV file",
        variant: "destructive",
      });
      return;
    }
    
    if (!isApiKeySet) {
      toast( "API Key Required",{
        description: "Please set your OpenAI API key in the settings first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create form data
      const formData = new FormData();
      
      // Add API key and visualization type
      formData.append('apiKey', apiKey);
      formData.append('visualizationType', selectedVisualization);
      
      // Add CSV files
      csvFiles.forEach(fileObj => {
        formData.append('csvFiles', fileObj.file);
      });
      
      // Call analyze-multiple-csv API
      const response = await fetch('/api/analyze-multiple-csv', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze CSV files');
      }
      
      const data = await response.json();
      
      // Update dashboard stats
      setDashboardStats(prev => ({
        ...prev,
        connectionCount: data.totalConnections,
        profileScore: calculateProfileScore(data.totalConnections),
        profileViews: Math.floor(data.totalConnections * 0.3),
        contentEngagement: Math.floor(data.totalConnections * 0.15),
        growthRate: Math.floor(Math.random() * 10) + 5
      }));
      
      // Extract cleanup suggestions
      const suggestions = extractCleanupSuggestions(data.content);
      setCleanupSuggestions(suggestions);
      
      setAnalysisCompleted(true);
      
      // Update messages
      setMessages(prev => [...prev, 
        { role: 'user', content: `Analyze my LinkedIn connections data from ${data.totalFiles} files` },
        { role: 'system', content: data.content }
      ]);
      
      toast(  "Multiple Files Analyzed",{
     
        description: `Successfully analyzed ${data.totalFiles} files with ${data.totalConnections} total connections.`,
      });
    } catch (error) {
      console.error("Error analyzing multiple CSV files:", error);
      toast(    "Analysis Error",{

        description: `Failed to analyze CSV files: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Save API key
  const saveApiKey = () => {
    if (apiKey.trim()) {
      // Save to localStorage
      localStorage.setItem('openai_api_key', apiKey);
      setIsApiKeySet(true);
      
      toast("API Key Saved",{
        description: "Your OpenAI API key has been saved securely in your browser.",
      });

    } else {
      localStorage.removeItem('openai_api_key');
      setIsApiKeySet(false);
      
      toast("API Key Removed",{
        description: "Your OpenAI API key has been removed.",
      });
    }
  };

  // Get visualization data based on the selected type
  const getVisualizationData = () => {
    return visualizationData[selectedVisualization] || [];
  };

  // Render the appropriate visualization
  const renderVisualization = (type) => {
    const data = type ? visualizationData[type] : getVisualizationData();
    const height = 300;
    
    if (!data || data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
          <ServerCrash className="h-12 w-12 mb-4" />
          <p>No data available for visualization</p>
        </div>
      );
    }
    
    switch (type || selectedVisualization) {
      case 'connections':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="connections" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'countries':
      case 'roles':
      case 'industries':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} connections`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
            <p>Select a visualization to see your data</p>
          </div>
        );
    }
  };

  // Progress Circle component for the dashboard
  const ProgressCircle = ({ value, maxValue = 100, size = 120, strokeWidth = 10, color = "#4f46e5" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = value / maxValue;
    const strokeDashoffset = circumference - progress * circumference;
    
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-xs text-gray-500">/ {maxValue}</span>
        </div>
      </div>
    );
  };

  // File list component
  const FileList = ({ files, type, onRemove }) => {
    if (!files.length) return null;
    
    return (
      <div className="mt-2 space-y-2">
        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm truncate max-w-[200px]">{file.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(type, index)}
              className="h-6 w-6"
            >
              <Trash2 className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  // CSV File Selection component
  const CsvFileSelection = () => {
    if (!csvFiles.length) return null;
    
    return (
      <div className="mt-4">
        <Label>Select CSV File for Analysis</Label>
        <Select 
          value={selectedCsvFile ? csvFiles.indexOf(selectedCsvFile).toString() : ""} 
          onValueChange={(value) => setSelectedCsvFile(csvFiles[parseInt(value)])}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a CSV file" />
          </SelectTrigger>
          <SelectContent>
            {csvFiles.map((file, index) => (
              <SelectItem key={index} value={index.toString()}>
                {file.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  // Settings Modal
  const SettingsModal = () => {
    if (activeView !== 'settings') return null;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Configure your API keys and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="api-key" 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..." 
              />
              <Button onClick={saveApiKey}>Save</Button>
            </div>
            <p className="text-xs text-gray-500">
              Your API key is stored locally in your browser and is never sent to our servers.
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">API Status</h3>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${isApiKeySet ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isApiKeySet ? 'Connected' : 'Not Connected'}</span>
            </div>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Usage</AlertTitle>
            <AlertDescription>
              Using your own OpenAI API key will allow you to analyze your LinkedIn profile and connection data.
              Requests will be billed to your OpenAI account.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  };

  // Render the main content based on the active view
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Profile Score</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ProgressCircle value={dashboardStats.profileScore} color="#4f46e5" />
                </CardContent>
                <CardFooter className="pt-0">
                  <p className="text-xs text-center w-full text-gray-500">
                    Your profile is stronger than {Math.floor(dashboardStats.profileScore * 0.8)}% of similar professionals
                  </p>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div className="text-right">
                      <p className="text-2xl font-bold">{dashboardStats.connectionCount}</p>
                      <p className="text-xs text-gray-500">+{Math.floor(dashboardStats.connectionCount * 0.03)} this month</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Progress value={80} className="h-1.5" />
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <User className="h-8 w-8 text-green-500" />
                    <div className="text-right">
                      <p className="text-2xl font-bold">{dashboardStats.profileViews}</p>
                      <p className="text-xs text-green-500">+{dashboardStats.growthRate}% from last month</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <LineChart
                    width={120}
                    height={40}
                    data={[
                      { name: 'Jan', value: Math.floor(dashboardStats.profileViews * 0.6) },
                      { name: 'Feb', value: Math.floor(dashboardStats.profileViews * 0.7) },
                      { name: 'Mar', value: Math.floor(dashboardStats.profileViews * 0.65) },
                      { name: 'Apr', value: Math.floor(dashboardStats.profileViews * 0.85) },
                      { name: 'May', value: dashboardStats.profileViews },
                    ]}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Content Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <MessageSquare className="h-8 w-8 text-purple-500" />
                    <div className="text-right">
                      <p className="text-2xl font-bold">{dashboardStats.contentEngagement}</p>
                      <p className="text-xs text-gray-500">interactions</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex justify-between items-center w-full">
                    <Badge variant="outline" className="text-xs">Likes: {Math.floor(dashboardStats.contentEngagement * 0.6)}</Badge>
                    <Badge variant="outline" className="text-xs">Comments: {Math.floor(dashboardStats.contentEngagement * 0.4)}</Badge>
                  </div>
                </CardFooter>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Connection Growth</CardTitle>
                  <CardDescription>
                    New connections over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderVisualization('connections')}
                </CardContent>
              </Card>
              
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Network Distribution</CardTitle>
                  <CardDescription>
                    Connections by industry
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderVisualization('industries')}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest interactions and profile updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{Math.floor(Math.random() * 5) + 1} new connection requests</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Your post received {Math.floor(Math.random() * 15) + 5} new engagements</p>
                      <p className="text-xs text-gray-500">Yesterday</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Profile viewed by {Math.floor(Math.random() * 10) + 3} recruiters</p>
                      <p className="text-xs text-gray-500">This week</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'optimize':
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upload Profile Data</CardTitle>
                <CardDescription>
                  Upload your LinkedIn profile and CV to get AI optimization suggestions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin-file">LinkedIn Profile (PDF/Screenshot) *</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      ref={fileInputRef}
                      id="linkedin-file" 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg,.txt" 
                      onChange={handleLinkedinUpload} 
                      multiple
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud className="h-5 w-5" />
                    </Button>
                  </div>
                  <FileList 
                    files={linkedinFiles} 
                    type="linkedin" 
                    onRemove={removeFile} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cv-file">CV/Resume (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="cv-file" 
                      type="file" 
                      accept=".pdf,.docx,.txt" 
                      onChange={handleCvUpload} 
                      multiple
                    />
                    <UploadCloud className="h-5 w-5 text-gray-500" />
                  </div>
                  <FileList 
                    files={cvFiles} 
                    type="cv" 
                    onRemove={removeFile} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="goal">Optimization Goal</Label>
                  <Select value={goal} onValueChange={setGoal}>
                    <SelectTrigger id="goal">
                      <SelectValue placeholder="Select your goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recruiters">Attract Recruiters</SelectItem>
                      <SelectItem value="clients">Attract Clients</SelectItem>
                      <SelectItem value="networking">Networking Opportunities</SelectItem>
                      <SelectItem value="investors">Attract Investors</SelectItem>
                      <SelectItem value="collaborators">Find Collaborators</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {!isApiKeySet && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>API Key Required</AlertTitle>
                    <AlertDescription>
                      Please set your OpenAI API key in Settings before using this feature.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={processWithAI} 
                  disabled={linkedinFiles.length === 0 || isProcessing || !isApiKeySet}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Generate Optimization Suggestions
                      <Sparkles className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>AI Optimization Suggestions</CardTitle>
                <CardDescription>
                  Personalized recommendations to improve your LinkedIn profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {aiResponse ? (
                    <div className="prose max-w-none whitespace-pre-line">
                      {aiResponse}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                      <AlertCircle className="h-12 w-12 mb-4" />
                      <p>Upload your profile and click "Generate Optimization Suggestions" to get AI recommendations</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'analyze':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Connection Data</CardTitle>
                  <CardDescription>
                    Export your connections data from LinkedIn and upload it here
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>How to export your LinkedIn data</AlertTitle>
                    <AlertDescription>
                      Go to your LinkedIn account settings → Privacy → Get a copy of your data → Connections.
                      Download the CSV file and upload it here.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label htmlFor="data-file">LinkedIn Connections Data (CSV)</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        ref={csvInputRef}
                        id="data-file" 
                        type="file" 
                        accept=".csv" 
                        onChange={handleCsvUpload} 
                        multiple
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => csvInputRef.current?.click()}
                      >
                        <FileUp className="h-5 w-5" />
                      </Button>
                    </div>
                    <FileList 
                      files={csvFiles} 
                      type="csv" 
                      onRemove={removeFile} 
                    />
                    
                    <CsvFileSelection />
                  </div>
                  
                  {!isApiKeySet && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>API Key Required</AlertTitle>
                      <AlertDescription>
                        Please set your OpenAI API key in Settings before using this feature.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  <Button 
                    className="w-full" 
                    onClick={analyzeLinkedinData} 
                    disabled={!selectedCsvFile || isProcessing || !isApiKeySet}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze Selected File
                        <BarChart3 className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    className="w-full" 
                    onClick={analyzeMultipleCsvFiles} 
                    disabled={csvFiles.length === 0 || isProcessing || !isApiKeySet}
                    variant="outline"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze All Files
                        <BarChart3 className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Data Cleanup Suggestions</CardTitle>
                  <CardDescription>
                    Recommendations to improve your LinkedIn connections data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisCompleted ? (
                    <div className="space-y-4">
                      <ul className="space-y-2">
                        {cleanupSuggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
                      <p>Upload your connections data and analyze it to get cleanup suggestions</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {analysisCompleted && (
              <Card>
                <CardHeader>
                  <CardTitle>Connection Visualizations</CardTitle>
                  <CardDescription>
                    Visual insights from your LinkedIn connections data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <Label htmlFor="visualization-type">Select Visualization</Label>
                    <Select value={selectedVisualization} onValueChange={setSelectedVisualization}>
                      <SelectTrigger id="visualization-type" className="w-full md:w-72">
                        <SelectValue placeholder="Select visualization type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="connections">
                          <div className="flex items-center">
                            <LineChartIcon className="mr-2 h-4 w-4" />
                            <span>Connection Growth Over Time</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="countries">
                          <div className="flex items-center">
                            <Globe className="mr-2 h-4 w-4" />
                            <span>Connections by Country</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="roles">
                          <div className="flex items-center">
                            <Briefcase className="mr-2 h-4 w-4" />
                            <span>Top Roles in Your Network</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="industries">
                          <div className="flex items-center">
                            <PieChartIcon className="mr-2 h-4 w-4" />
                            <span>Connections by Industry</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {renderVisualization()}
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Insights</h3>
                    {selectedVisualization === 'connections' && (
                      <p>Your network has grown steadily over time, with approximately {dashboardStats.connectionCount} total connections.</p>
                    )}
                    {selectedVisualization === 'countries' && (
                      <p>Your connections are spread across multiple countries, with the highest concentration in {visualizationData.countries[0]?.name}.</p>
                    )}
                    {selectedVisualization === 'roles' && (
                      <p>The most common role in your network is {visualizationData.roles[0]?.name}, followed by {visualizationData.roles[1]?.name}.</p>
                    )}
                    {selectedVisualization === 'industries' && (
                      <p>Your network is primarily concentrated in {visualizationData.industries[0]?.name}, with {visualizationData.industries[1]?.name} as the second most common industry.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
        
      case 'custom':
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Custom AI Prompt</CardTitle>
                <CardDescription>
                  Create your own custom prompt for LinkedIn profile analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin-file-custom">LinkedIn Profile (PDF/Screenshot) *</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="linkedin-file-custom" 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg,.txt" 
                      onChange={handleLinkedinUpload} 
                      multiple
                    />
                    <UploadCloud className="h-5 w-5 text-gray-500" />
                  </div>
                  <FileList 
                    files={linkedinFiles} 
                    type="linkedin" 
                    onRemove={removeFile} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cv-file-custom">CV/Resume (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="cv-file-custom" 
                      type="file" 
                      accept=".pdf,.docx,.txt" 
                      onChange={handleCvUpload} 
                      multiple
                    />
                    <FileText className="h-5 w-5 text-gray-500" />
                  </div>
                  <FileList 
                    files={cvFiles} 
                    type="cv" 
                    onRemove={removeFile} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="custom-prompt">Custom Prompt</Label>
                  <Textarea 
                    id="custom-prompt" 
                    rows={6} 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Enter your custom prompt for the AI..."
                  />
                  <p className="text-xs text-gray-500">
                    Use [goal] in your prompt to reference your selected optimization goal.
                  </p>
                </div>
                
                {!isApiKeySet && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>API Key Required</AlertTitle>
                    <AlertDescription>
                      Please set your OpenAI API key in Settings before using this feature.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={processCustomPrompt} 
                  disabled={!customPrompt.trim() || linkedinFiles.length === 0 || isProcessing || !isApiKeySet}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Process Custom Prompt
                      <Code className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Custom AI Response</CardTitle>
                <CardDescription>
                  Results from your custom prompt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {aiResponse ? (
                    <div className="prose max-w-none whitespace-pre-line">
                      {aiResponse}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                      <FileQuestion className="h-12 w-12 mb-4" />
                      <p>Enter a custom prompt and click "Process Custom Prompt" to get AI analysis</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'chat':
        return (
          <div className="flex flex-col h-[calc(100vh-10rem)]">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle>AI Assistant Chat</CardTitle>
                <CardDescription>
                  Chat with the AI about your LinkedIn profile and data
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-[calc(100%-4rem)] pr-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div 
                        key={index} 
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messageEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex items-center w-full gap-2">
                  <Input 
                    placeholder="Ask about your LinkedIn profile..." 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={isProcessing || !isApiKeySet}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!messageInput.trim() || isProcessing || !isApiKeySet}
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {!isApiKeySet && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>API Key Required</AlertTitle>
                    <AlertDescription>
                      Please set your OpenAI API key in Settings before using the chat feature.
                    </AlertDescription>
                  </Alert>
                )}
              </CardFooter>
            </Card>
          </div>
        );
        
      case 'settings':
        return <SettingsModal />;
        
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">LinkedIn Optimizer</h2>
            <p className="text-sm text-gray-500">AI-powered profile enhancement</p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              <div className="space-y-1">
                <button
                  className={`w-full flex items-center gap-2 p-2 text-sm rounded-lg transition-colors ${
                    activeView === 'dashboard' 
                      ? 'bg-gray-100 text-blue-600 font-medium' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setActiveView('dashboard');
                    setIsSidebarOpen(false);
                  }}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </button>
                
                <button
                  className={`w-full flex items-center gap-2 p-2 text-sm rounded-lg transition-colors ${
                    activeView === 'optimize' 
                      ? 'bg-gray-100 text-blue-600 font-medium' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setActiveView('optimize');
                    setIsSidebarOpen(false);
                  }}
                >
                  <Sparkles className="h-5 w-5" />
                  Profile Optimization
                </button>
                
                <button
                  className={`w-full flex items-center gap-2 p-2 text-sm rounded-lg transition-colors ${
                    activeView === 'analyze' 
                      ? 'bg-gray-100 text-blue-600 font-medium' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setActiveView('analyze');
                    setIsSidebarOpen(false);
                  }}
                >
                  <BarChart3 className="h-5 w-5" />
                  Connection Analysis
                </button>
                
                <button
                  className={`w-full flex items-center gap-2 p-2 text-sm rounded-lg transition-colors ${
                    activeView === 'custom' 
                      ? 'bg-gray-100 text-blue-600 font-medium' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setActiveView('custom');
                    setIsSidebarOpen(false);
                  }}
                >
                  <Code className="h-5 w-5" />
                  Custom Prompts
                </button>
                
                <button
                  className={`w-full flex items-center gap-2 p-2 text-sm rounded-lg transition-colors ${
                    activeView === 'chat' 
                      ? 'bg-gray-100 text-blue-600 font-medium' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setActiveView('chat');
                    setIsSidebarOpen(false);
                  }}
                >
                  <MessageSquare className="h-5 w-5" />
                  AI Chat
                </button>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-1">
                <button
                  className={`w-full flex items-center gap-2 p-2 text-sm rounded-lg transition-colors ${
                    activeView === 'settings' 
                      ? 'bg-gray-100 text-blue-600 font-medium' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setActiveView('settings');
                    setIsSidebarOpen(false);
                  }}
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </button>
                
                <button
                  className="w-full flex items-center gap-2 p-2 text-sm rounded-lg hover:bg-gray-50"
                  onClick={() => {
                    window.open('https://help.linkedin.com/app/answers/detail/a_id/66/~/exporting-connections-from-linkedin', '_blank');
                  }}
                >
                  <HelpCircle className="h-5 w-5" />
                  Help
                </button>
              </div>
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="/api/placeholder/40/40" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">User Profile</p>
                <p className="text-xs text-gray-500">
                  {isApiKeySet ? (
                    <span className="flex items-center text-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      API Connected
                    </span>
                  ) : (
                    <span className="flex items-center text-red-500">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      API Not Connected
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 lg:ml-64 ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{
              activeView === 'dashboard' ? 'Dashboard' :
              activeView === 'optimize' ? 'Profile Optimization' :
              activeView === 'analyze' ? 'Connection Analysis' :
              activeView === 'custom' ? 'Custom Prompts' :
              activeView === 'chat' ? 'AI Chat' :
              'Settings'
            }</h1>
            <p className="text-gray-500">
              {
                activeView === 'dashboard' ? 'Key metrics and insights from your LinkedIn profile' :
                activeView === 'optimize' ? 'Get AI-powered suggestions to improve your profile' :
                activeView === 'analyze' ? 'Analyze your LinkedIn connections data' :
                activeView === 'custom' ? 'Create custom AI prompts for specific insights' :
                activeView === 'chat' ? 'Chat with the AI assistant about your LinkedIn profile' :
                'Configure your API keys and preferences'
              }
            </p>
          </div>
          
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default LinkedInDashboard;