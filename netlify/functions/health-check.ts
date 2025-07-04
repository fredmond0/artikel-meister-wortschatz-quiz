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

    console.log('Health check response status:', healthResponse.status);
    console.log('Health check response ok:', healthResponse.ok);

    if (!healthResponse.ok) {
      const errorText = await healthResponse.text();
      console.error('Health check API error:', errorText);
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: 'AI service unavailable',
          details: `Health check failed: ${healthResponse.status}`,
          apiResponse: errorText.substring(0, 200)
        }),
      };
    }

    const healthData = await healthResponse.json();
    console.log('Health check response structure:', Object.keys(healthData));
    console.log('Health check candidates length:', healthData.candidates?.length || 0);
    
    const responseText = healthData.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Health check response text:', responseText);

    if (!responseText) {
      console.error('Health check returned empty response');
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: 'AI service not responding correctly',
          details: 'Health check returned empty response',
          debugInfo: JSON.stringify(healthData, null, 2).substring(0, 300)
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