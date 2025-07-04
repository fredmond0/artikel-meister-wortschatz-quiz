import { Handler } from '@netlify/functions';

interface RequestBody {
  topic: string;
  count?: number;
}

interface CustomWord {
  german: string;
  article: 'der' | 'die' | 'das' | '';
  type: string;
  english: string[];
}

interface TopicVocabularyResponse {
  topic: string;
  words: CustomWord[];
  difficulty: string;
  count: number;
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
    console.log('=== Topic vocabulary function called ===');
    console.log('Method:', event.httpMethod);
    console.log('Body received:', event.body);
    
    const body: RequestBody = JSON.parse(event.body || '{}');
    console.log('Parsed request body:', JSON.stringify(body, null, 2));
    
    const { topic, count = 15 } = body;

    if (!topic || topic.trim().length === 0) {
      console.log('ERROR: Missing required field: topic');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required field: topic' }),
      };
    }

    // Validate count (reasonable limits)
    if (count < 10 || count > 100) {
      console.log('ERROR: Invalid count:', count);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Count must be between 10 and 100' }),
      };
    }

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

    const prompt = `Generate ${count} German vocabulary words related to "${topic}". Return ONLY a valid JSON array without any additional text.

Format: [{"german": "word", "article": "der/die/das or empty string", "type": "noun/verb/adjective", "english": ["translation"]}]

Requirements:
- Include a mix of nouns, verbs, and adjectives
- For nouns: include the correct article (der/die/das)
- For verbs and adjectives: leave article as empty string ""
- German words should be base forms (infinitive for verbs, nominative singular for nouns)
- English translations should be the most common/basic translation in an array with one element
- Words should be appropriate for intermediate German learners
- Avoid extremely obscure or technical terms unless specifically relevant to the topic
- All words should be genuine German words with accurate translations
- CRITICAL: The "german" field should contain ONLY the German word WITHOUT the article. The article goes in the separate "article" field.
- CORRECT example: {"german": "Koch", "article": "der", "type": "noun", "english": ["cook"]}
- WRONG example: {"german": "der Koch", "article": "der", "type": "noun", "english": ["cook"]}

Return ONLY the JSON array, no other text.`;

    console.log('Calling Gemini API...');
    console.log('Prompt length:', prompt.length);
    console.log('Topic:', topic);
    console.log('Count:', count);

    // Call Gemini API
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
            maxOutputTokens: 4096,
          },
        }),
      }
    );
    
    console.log('Gemini response status:', geminiResponse.status);
    console.log('Gemini response ok:', geminiResponse.ok);
    console.log('Gemini response headers:', JSON.stringify([...geminiResponse.headers.entries()]));

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error details:', errorText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to generate vocabulary from AI service',
          details: `Gemini API error: ${geminiResponse.status}`,
          apiResponse: errorText
        }),
      };
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response structure:', Object.keys(geminiData));
    console.log('Gemini candidates length:', geminiData.candidates?.length || 0);
    
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Generated text length:', generatedText?.length || 0);
    console.log('Generated text preview:', generatedText?.substring(0, 200) + '...');

    if (!generatedText) {
      console.error('No generated text from Gemini');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'No response content from AI service',
          details: 'The AI service returned an empty response'
        }),
      };
    }

    // Parse the JSON response from Gemini
    let parsedWords: CustomWord[];
    try {
      console.log('Attempting to parse JSON from AI response...');
      
      // Try to extract JSON array from the response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in response');
        console.error('Full response text:', generatedText);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid AI response format',
            details: 'No JSON array found in AI response',
            aiResponse: generatedText.substring(0, 500)
          }),
        };
      }
      
      console.log('Found JSON match, length:', jsonMatch[0].length);
      parsedWords = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed JSON, word count:', parsedWords.length);
      
      // Validate the structure
      if (!Array.isArray(parsedWords)) {
        throw new Error('Response is not an array');
      }

      // Validate each word object
      parsedWords.forEach((word, index) => {
        if (!word.german || !word.type || !Array.isArray(word.english) || word.english.length === 0) {
          throw new Error(`Invalid word structure at index ${index}: ${JSON.stringify(word)}`);
        }
        // Ensure article is a string (empty for non-nouns)
        if (typeof word.article !== 'string') {
          word.article = '';
        }
        // Ensure article is one of the valid values
        if (word.article && !['der', 'die', 'das', ''].includes(word.article)) {
          word.article = '';
        }
      });

      console.log(`Successfully validated ${parsedWords.length} words`);

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', generatedText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to parse vocabulary list from AI response',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
          aiResponse: generatedText.substring(0, 500)
        }),
      };
    }

    // Remove duplicates based on German word
    const uniqueWords = parsedWords.filter((word, index, self) => 
      index === self.findIndex(w => w.german.toLowerCase() === word.german.toLowerCase())
    );

    console.log(`Removed ${parsedWords.length - uniqueWords.length} duplicate words`);

    const response: TopicVocabularyResponse = {
      topic,
      words: uniqueWords,
      difficulty: 'intermediate',
      count: uniqueWords.length
    };

    console.log('=== Sending successful response ===');
    console.log('Response word count:', response.count);
    console.log('Response structure:', Object.keys(response));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('=== FUNCTION ERROR ===');
    console.error('Error in get-topic-vocabulary function:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Request body was:', event.body);
    console.error('Event method:', event.httpMethod);
    console.error('Event headers:', JSON.stringify(event.headers));
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error while generating vocabulary', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}; 