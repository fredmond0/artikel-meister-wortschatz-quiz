import { Handler } from '@netlify/functions';

interface RequestBody {
  german: string;
  type: string;
  english: string[];
  article?: string;
}

interface GeminiResponse {
  sentence: string;
  translation: string;
  conjugation?: string;
  grammar_note?: string;
}

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
    console.log('Function called with event:', event.httpMethod, event.body);
    const body: RequestBody = JSON.parse(event.body || '{}');
    console.log('Parsed body:', body);
    const { german, type, english, article } = body;

    if (!german || !type || !english) {
      console.log('Missing required fields:', { german, type, english });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: german, type, english' }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API key present:', !!apiKey);
    console.log('API key length:', apiKey?.length || 0);
    if (!apiKey) {
      console.log('No API key found!');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    // Create the prompt based on word type
    let prompt = '';
    if (type === 'noun' && article) {
      prompt = `Create an example sentence using the German noun "${article} ${german}" (meaning: ${english.join(', ')}). 
      
      Please provide:
      1. A natural German sentence using this noun
      2. The English translation of the sentence
      3. A brief grammar note about the noun's usage
      
      Format your response as JSON with these exact keys:
      {
        "sentence": "German sentence here",
        "translation": "English translation here",
        "grammar_note": "Brief grammar explanation here"
      }`;
    } else if (type === 'verb') {
      prompt = `Create an example sentence using the German verb "${german}" (meaning: ${english.join(', ')}). 
      
      Please provide:
      1. A natural German sentence using this verb
      2. The English translation of the sentence
      3. The conjugation pattern (present tense: ich, du, er/sie/es, wir, ihr, sie)
      
      Format your response as JSON with these exact keys:
      {
        "sentence": "German sentence here",
        "translation": "English translation here",
        "conjugation": "ich [form], du [form], er/sie/es [form], wir [form], ihr [form], sie [form]"
      }`;
    } else {
      prompt = `Create an example sentence using the German word "${german}" (${type}, meaning: ${english.join(', ')}). 
      
      Please provide:
      1. A natural German sentence using this word
      2. The English translation of the sentence
      3. A brief grammar note about this word's usage
      
      Format your response as JSON with these exact keys:
      {
        "sentence": "German sentence here",
        "translation": "English translation here",
        "grammar_note": "Brief grammar explanation here"
      }`;
    }

    // Call Gemini API
    console.log('Calling Gemini API with prompt length:', prompt.length);
    const geminiResponse = await fetch(
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
                  text: prompt,
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
    
    console.log('Gemini response status:', geminiResponse.status);
    console.log('Gemini response ok:', geminiResponse.ok);

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates[0]?.content?.parts[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini');
    }

    // Parse the JSON response from Gemini
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Gemini');
    }

    const parsedResponse: GeminiResponse = JSON.parse(jsonMatch[0]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(parsedResponse),
    };

  } catch (error) {
    console.error('Error in get-sentence function:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Request body was:', event.body);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate sentence', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack'
      }),
    };
  }
}; 