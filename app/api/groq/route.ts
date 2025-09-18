// /app/api/groq/route.ts - Next.js App Router
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Get API key from environment variable
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    // Debug için (PRODUCTION'DA KALDIR!)
    console.log('API Key exists:', !!GROQ_API_KEY);
    console.log('API Key starts with:', GROQ_API_KEY?.substring(0, 4));
    
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { 
          error: { 
            message: 'Server configuration error: API key not found',
            type: 'server_error',
            code: 'missing_api_key'
          } 
        },
        { 
          status: 500,
          headers: corsHeaders 
        }
      );
    }

    // Get request body
    const requestBody = await request.json();

    // Make request to Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: requestBody.model || 'llama-3.1-8b-instant',
        messages: requestBody.messages,
        temperature: requestBody.temperature || 0.7,
        max_tokens: requestBody.max_tokens || 1024,
        stream: false,
      }),
    });

    // Get response as text first
    const responseText = await groqResponse.text();
    
    // Debug
    console.log('Groq Status:', groqResponse.status);
    
    // Parse response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Parse error:', e);
      return NextResponse.json(
        { 
          error: { 
            message: 'Invalid response from Groq API',
            type: 'parse_error',
            details: responseText.substring(0, 200)
          } 
        },
        { 
          status: 502,
          headers: corsHeaders 
        }
      );
    }

    // Check for errors
    if (!groqResponse.ok) {
      console.error('Groq API error:', responseData);
      return NextResponse.json(
        responseData,
        { 
          status: groqResponse.status,
          headers: corsHeaders 
        }
      );
    }

    // Return success response
    return NextResponse.json(
      responseData,
      { 
        status: 200,
        headers: corsHeaders 
      }
    );

  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        error: { 
          message: error.message || 'Internal server error',
          type: 'server_error'
        } 
      },
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
}
