import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    // Quick health check with minimal request
    const healthResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Say "OK"',
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 10,
          },
        }),
      }
    );

    if (!healthResponse.ok) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: 'AI service unavailable',
          details: `Health check failed: ${healthResponse.status}`
        }),
      };
    }

    const healthData = await healthResponse.json();
    const responseText = healthData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: 'AI service not responding correctly',
          details: 'Health check returned empty response'
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        status: 'healthy',
        message: 'AI service is available',
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('Health check error:', error);
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ 
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}; 