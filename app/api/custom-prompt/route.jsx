import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request) {
  try {
    // Parse multipart form data to handle file uploads
    const formData = await request.formData();
    const apiKey = formData.get('apiKey');
    const customPrompt = formData.get('customPrompt');
    const goal = formData.get('goal') || '';
    const linkedinFiles = formData.getAll('linkedinFiles');
    const cvFiles = formData.getAll('cvFiles');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    if (!customPrompt) {
      return NextResponse.json(
        { error: 'Custom prompt is required' },
        { status: 400 }
      );
    }

    // Process the custom prompt (replace [goal] with the actual goal)
    const processedPrompt = customPrompt.replace(/\[goal\]/g, goal);

    // Process files and extract content
    const fileContents = [];
    
    // Process LinkedIn files
    for (const file of linkedinFiles) {
      const content = await file.text();
      fileContents.push({
        type: 'linkedinProfile',
        name: file.name,
        content
      });
    }

    // Process CV files if available
    for (const file of cvFiles) {
      const content = await file.text();
      fileContents.push({
        type: 'cv',
        name: file.name,
        content
      });
    }

    // Create messages array for OpenAI
    const messages = [
      { role: 'system', content: 'You are an AI assistant specializing in LinkedIn profile optimization and career development.' },
      { role: 'user', content: processedPrompt }
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
      apiKey:apiKey
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
    console.error('Error in custom prompt API:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
