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
    console.log('=== Health check function called ===');
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API key present:', !!apiKey);
    console.log('API key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      console.log('ERROR: No API key found!');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    // Quick health check with minimal request (same approach as get-sentence)
    console.log('Calling Gemini API for health check...');
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
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    console.log('Health check response status:', healthResponse.status);
    console.log('Health check response ok:', healthResponse.ok);

    if (!healthResponse.ok) {
      throw new Error(`Gemini API error: ${healthResponse.status}`);
    }

    const healthData = await healthResponse.json();
    const responseText = healthData.candidates[0]?.content?.parts[0]?.text;

    if (!responseText) {
      throw new Error('No response from Gemini');
    }

    console.log('Health check successful, response:', responseText);

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