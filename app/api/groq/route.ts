// /api/groq.js - Vercel Edge Function
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS request (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get API key from environment variable
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    // Debug için (PRODUCTION'DA KALDIRILMALI!)
    console.log('API Key exists:', !!GROQ_API_KEY);
    console.log('API Key prefix:', GROQ_API_KEY?.substring(0, 7));
    
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: { 
            message: 'Server configuration error: API key not found',
            type: 'server_error',
            code: 'missing_api_key'
          } 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        stream: false, // Flutter'da stream kullanmıyoruz
      }),
    });

    // Get response text first
    const responseText = await groqResponse.text();
    
    // Debug response
    console.log('Groq API Status:', groqResponse.status);
    console.log('Groq API Response:', responseText.substring(0, 200));

    // Parse response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: { 
            message: 'Invalid response from Groq API',
            type: 'api_error',
            details: responseText
          } 
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for Groq API errors
    if (!groqResponse.ok) {
      return new Response(
        JSON.stringify(responseData),
        {
          status: groqResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return successful response
    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in Groq proxy:', error);
    return new Response(
      JSON.stringify({ 
        error: { 
          message: error.message || 'Internal server error',
          type: 'server_error'
        } 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
