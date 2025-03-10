import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import * as pdfParse from 'pdf-parse';

async function extractTextFromPDF(base64PDF) {
  try {
    // Ensure base64 is properly formatted
    const base64Data = base64PDF.replace(/^data:application\/pdf;base64,/, ''); // Remove metadata if present
    const pdfBuffer = Buffer.from(base64Data, 'base64'); // Convert to Buffer
    
    // Parse PDF text
    const data = await pdf(pdfBuffer);
    
    return data.text.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const goal = formData.get('goal');
    const linkedinData = JSON.parse(formData.get('linkedinData') || 'null');
    const cvData = formData.get('cvData') ? JSON.parse(formData.get('cvData')) : null;
    const apiKey = formData.get('apiKey'); // Get API key from form data

    if (!apiKey) {
      throw new Error('No API key provided');
    }

    if (!linkedinData || !linkedinData.content) {
      throw new Error('No LinkedIn PDF data provided');
    }

    // Initialize OpenAI with the provided API key
    const openai = new OpenAI({
      apiKey: apiKey
    });

    console.log('Processing LinkedIn Data:', linkedinData);
    console.log('Goal:', goal);

    // Extract text from LinkedIn PDF
    const linkedinText = await extractTextFromPDF(linkedinData.content);
    let cvText = '';

    // Optional: Extract CV text if provided
    if (cvData && cvData.content) {
      try {
        cvText = await extractTextFromPDF(cvData.content);
        console.log('CV Text extracted successfully');
      } catch (cvError) {
        console.error('CV extraction error:', cvError);
      }
    }

    const messages = [
      {
        role: "system",
        content: "You are an expert LinkedIn profile optimizer with deep knowledge of professional branding and industry trends."
      },
      {
        role: "user",
        content: `Analyze this professional profile with the goal of ${goal}.
        
        LinkedIn Profile Content:
        ${linkedinText}
        
        ${cvText ? `CV/Resume Content:\n${cvText}` : ''}
        
        Please provide recommendations in the following format:
        1. Profile Strengths
        2. Areas for Improvement
        3. Specific Recommendations
        4. Industry Alignment
        5. Additional Suggestions for Achieving Goal: ${goal}`
      }
    ];

    // Estimate token usage and adjust if needed
    const totalTokens = messages.reduce((acc, msg) => acc + (msg.content || '').split(' ').length, 0);
    console.log(`Estimated message tokens: ${totalTokens}`);

    const completion = await openai.chat.completions.create({
      messages,
      model: "gpt-3.5-turbo",
      max_tokens: 1500,
      temperature: 0.7  // Add some creativity to recommendations
    });

    return NextResponse.json({ 
      analysis: completion.choices[0].message.content,
      success: true
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ 
      error: error.message || 'Analysis failed',
      success: false 
    }, { status: 500 });
  }
}