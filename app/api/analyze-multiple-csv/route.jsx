import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Papa from 'papaparse';

export async function POST(request) {
  try {
    // Parse multipart form data to handle file uploads
    const formData = await request.formData();
    const apiKey = formData.get('apiKey');
    const csvFiles = formData.getAll('csvFiles');
    const visualizationType = formData.get('visualizationType') || 'general';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    if (!csvFiles || csvFiles.length === 0) {
      return NextResponse.json(
        { error: 'At least one CSV file is required' },
        { status: 400 }
      );
    }

    // Process all CSV files
    const filesData = [];
    let totalConnectionsCount = 0;
    
    for (const file of csvFiles) {
      // Read and parse the CSV file
      const csvContent = await file.text();
      
      // Parse CSV data
      const parsedCsv = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true
      });

      totalConnectionsCount += parsedCsv.data.length;
      
      filesData.push({
        fileName: file.name,
        headers: parsedCsv.meta.fields,
        totalRows: parsedCsv.data.length,
        preview: parsedCsv.data.slice(0, 5)
      });
    }
    
    // Create system message based on visualization type
    let systemMessage = `You are an AI expert in analyzing LinkedIn connection data. You'll receive data from multiple LinkedIn connections exports.`;
    let userMessage = `Please analyze my LinkedIn connections data from ${csvFiles.length} files and provide insights.`;
    
    // Add specific instructions based on visualization type
    if (visualizationType === 'countries') {
      systemMessage += ` Focus on geographical distribution of connections.`;
      userMessage += ` Focus on the geographical distribution of my connections.`;
    } else if (visualizationType === 'roles') {
      systemMessage += ` Focus on the professional roles and positions of connections.`;
      userMessage += ` Focus on the professional roles and positions of my connections.`;
    } else if (visualizationType === 'industries') {
      systemMessage += ` Focus on the industry distribution of connections.`;
      userMessage += ` Focus on the industry distribution of my connections.`;
    } else if (visualizationType === 'growth') {
      systemMessage += ` Focus on the growth of connections over time.`;
      userMessage += ` Focus on how my network has grown over time.`;
    }
    
    // Create data summary for OpenAI
    const dataSummary = `
      Total files: ${csvFiles.length}
      Total connections across all files: ${totalConnectionsCount}
      
      File details:
      ${filesData.map(file => 
        `File: ${file.fileName}
         Headers: ${file.headers.join(', ')}
         Total rows: ${file.totalRows}
         Preview: ${JSON.stringify(file.preview[0])}`
      ).join('\n\n')}
    `;
    
    // Create messages array for OpenAI
    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: `${userMessage}\n\n${dataSummary}` }
    ];

    // Call OpenAI API
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    return NextResponse.json({
      content: response.choices[0].message.content,
      totalFiles: csvFiles.length,
      totalConnections: totalConnectionsCount,
      filesData: filesData.map(file => ({
        fileName: file.fileName,
        totalRows: file.totalRows,
        headers: file.headers
      })),
      usage: response.usage,
    });
  } catch (error) {
    console.error('Error in analyze multiple CSV API:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
}