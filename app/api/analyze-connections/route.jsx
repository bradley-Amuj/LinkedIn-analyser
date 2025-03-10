import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Papa from 'papaparse';

export async function POST(request) {
  try {
    // Parse multipart form data to handle file uploads
    const formData = await request.formData();
    const apiKey = formData.get('apiKey');
    const csvFile = formData.get('csvFile');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    if (!csvFile) {
      return NextResponse.json(
        { error: 'CSV file is required' },
        { status: 400 }
      );
    }

    // Read and parse the CSV file
    const csvContent = await csvFile.text();
    
    // Parse CSV data
    const parsedCsv = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true
    });

    // Get column headers for analysis context
    const headers = parsedCsv.meta.fields;
    
    // Limit data rows for API payload size
    const dataPreview = parsedCsv.data.slice(0, 100);
    
    // Create summary statistics
    const totalConnections = parsedCsv.data.length;
    
    // Create messages array for OpenAI
    const systemMessage = `You are an AI expert in analyzing LinkedIn connection data. You'll receive CSV data from a LinkedIn connections export. Analyze this data and provide insights and recommendations.`;
    
    const dataDescription = `
      CSV File: ${csvFile.name}
      Total connections: ${totalConnections}
      Column headers: ${headers.join(', ')}
      
      Here's a preview of the first few rows:
      ${JSON.stringify(dataPreview.slice(0, 5), null, 2)}
    `;
    
    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: `Please analyze my LinkedIn connections data and provide insights. ${dataDescription}` }
    ];

    // Call OpenAI API
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Extract network insights from the response
    const aiResponse = response.choices[0].message.content;

    // Return both the AI analysis and the parsed data for visualization
    return NextResponse.json({
      content: aiResponse,
      totalConnections,
      headers,
      dataPreview: dataPreview.slice(0, 20), // Send a small preview for UI display
      usage: response.usage,
    });
  } catch (error) {
    console.error('Error in analyze connections API:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
}