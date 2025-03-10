import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import PDFParser from 'pdf2json';

export async function POST(request) {
  try {
    // Parse multipart form data to handle file uploads
    const formData = await request.formData();
    const apiKey = formData.get('apiKey');
    const goal = formData.get('goal') || 'recruiters';
    const linkedinFiles = formData.getAll('linkedinFiles');
    const cvFiles = formData.getAll('cvFiles');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    if (!linkedinFiles || linkedinFiles.length === 0) {
      return NextResponse.json(
        { error: 'LinkedIn profile file is required' },
        { status: 400 }
      );
    }

    // Process files and extract content
    const fileContents = [];
    
    // Helper function to handle text files
    async function processTextFile(file) {
      return await file.text();
    }
    
    // Helper function to extract text from PDF files using pdf2json
    async function extractTextFromPDF(file) {
      // Create a temporary file to store the PDF
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `temp-${Date.now()}-${file.name}`);
      
      try {
        // Write the file to disk temporarily
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(tempFilePath, buffer);
        
        // Create a new PDF parser
        const pdfParser = new PDFParser();
        
        // Parse the PDF file
        const parsePromise = new Promise((resolve, reject) => {
          pdfParser.on("pdfParser_dataReady", data => {
            resolve(data);
          });
          
          pdfParser.on("pdfParser_dataError", error => {
            reject(error);
          });
          
          pdfParser.loadPDF(tempFilePath);
        });
        
        const pdfData = await parsePromise;
        
        // Extract text from the parsed data
        let extractedText = '';
        
        // Process each page
        pdfData.Pages.forEach((page, pageIndex) => {
          extractedText += `\n\n--- Page ${pageIndex + 1} ---\n\n`;
          
          // Process each text element on the page
          page.Texts.forEach(textItem => {
            // Decode the text content (pdf2json encodes spaces as '%20' and other special characters)
            const decodedText = decodeURIComponent(textItem.R.map(t => t.T).join(' '));
            extractedText += decodedText + ' ';
          });
        });
        
        return extractedText.trim();
      } catch (error) {
        console.error('Error extracting text from PDF:', error);
        return `[Error extracting text from PDF: ${error.message}. Falling back to file metadata.]\n` +
               `File name: ${file.name}\nFile type: ${file.type}\nFile size: ${Math.round(file.size / 1024)} KB`;
      } finally {
        // Clean up the temporary file
        try {
          await fs.unlink(tempFilePath);
        } catch (error) {
          console.error('Error deleting temporary file:', error);
        }
      }
    }
    
    // Helper function to process each file based on its type
    async function processFile(file) {
      if (file.type === 'application/pdf') {
        return await extractTextFromPDF(file);
      } else {
        return await processTextFile(file);
      }
    }
    
    // Process LinkedIn files
    for (const file of linkedinFiles) {
      try {
        const content = await processFile(file);
        fileContents.push({
          type: 'linkedinProfile',
          name: file.name,
          content
        });
        console.log(`Processed LinkedIn file: ${file.name}`);
      } catch (error) {
        console.error(`Error processing LinkedIn file ${file.name}:`, error);
        fileContents.push({
          type: 'linkedinProfile',
          name: file.name,
          content: `[Error processing file: ${error.message}]`
        });
      }
    }

    // Process CV files if available
    for (const file of cvFiles) {
      try {
        const content = await processFile(file);
        fileContents.push({
          type: 'cv',
          name: file.name,
          content
        });
        console.log(`Processed CV file: ${file.name}`);
      } catch (error) {
        console.error(`Error processing CV file ${file.name}:`, error);
        fileContents.push({
          type: 'cv',
          name: file.name,
          content: `[Error processing file: ${error.message}]`
        });
      }
    }

    // Create messages array for OpenAI
    const systemMessage = `You are an AI expert in optimizing LinkedIn profiles. Analyze the provided LinkedIn profile and CV to give detailed suggestions for improvement to attract ${goal}.`;
    
    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: `Please optimize my LinkedIn profile to attract more ${goal}. I'm uploading my profile and CV for analysis.` }
    ];

    // Add file contents as messages
    fileContents.forEach(file => {
      messages.push({
        role: 'user',
        content: `Here is my ${file.type === 'linkedinProfile' ? 'LinkedIn profile' : 'CV'} content from file ${file.name}:\n\n${file.content}`
      });
    });

    // Call OpenAI API
    const openai = new OpenAI({
      apiKey: apiKey
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    return NextResponse.json({
      content: response.choices[0].message.content,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Error in optimize profile API:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
}