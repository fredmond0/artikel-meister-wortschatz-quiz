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
  warning?: string;
  finishReason?: string;
}

interface PartialRecoveryResult {
  success: boolean;
  words: CustomWord[];
  error?: string;
}

// Function to attempt partial recovery from incomplete JSON
function attemptPartialRecovery(jsonString: string, finishReason?: string): PartialRecoveryResult {
  try {
    console.log('Attempting partial recovery from incomplete JSON...');
    console.log('JSON string length:', jsonString.length);
    console.log('Finish reason:', finishReason);
    
    // Remove the outer ```json and ``` if present
    let cleanJson = jsonString.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    
    // Strategy: Find the last properly closed object by looking for complete patterns
    // We'll search backwards from the end to find the last complete "}" that closes an object
    
    // Split by lines to analyze the structure
    const lines = cleanJson.split('\n');
    let braceDepth = 0;
    let inString = false;
    let lastCompleteObjectIndex = -1;
    
    // Parse through the JSON to find structure
    for (let i = 0; i < cleanJson.length; i++) {
      const char = cleanJson[i];
      const prevChar = i > 0 ? cleanJson[i - 1] : '';
      
      if (char === '"' && prevChar !== '\\') {
        inString = !inString;
      } else if (!inString) {
        if (char === '{') {
          braceDepth++;
        } else if (char === '}') {
          braceDepth--;
          // If we're back to depth 1, we just closed a complete object
          if (braceDepth === 1) {
            lastCompleteObjectIndex = i;
          }
        }
      }
    }
    
    console.log('Brace depth analysis complete. Last complete object index:', lastCompleteObjectIndex);
    console.log('Final brace depth:', braceDepth);
    
    if (lastCompleteObjectIndex === -1) {
      console.log('Primary parsing failed, trying fallback patterns...');
      // Fallback: look for the last occurrence of complete object patterns
      const patterns = [
        /}\s*,\s*{/g,  // }, {
        /}\s*\]/g,     // }]
        /}\s*,\s*$/g   // }, at end
      ];
      
      for (const pattern of patterns) {
        let match: RegExpExecArray | null;
        let lastMatch: RegExpExecArray | null = null;
        while ((match = pattern.exec(cleanJson)) !== null) {
          lastMatch = match;
        }
        if (lastMatch) {
          lastCompleteObjectIndex = lastMatch.index + lastMatch[0].length - 1;
          console.log('Fallback pattern found match at index:', lastCompleteObjectIndex);
          break;
        }
      }
    }
    
    if (lastCompleteObjectIndex === -1) {
      console.log('No complete object structure found');
      console.log('JSON preview (first 200 chars):', cleanJson.substring(0, 200));
      console.log('JSON preview (last 200 chars):', cleanJson.substring(cleanJson.length - 200));
      return {
        success: false,
        words: [],
        error: 'No complete word objects found in JSON'
      };
    }
    
    // Extract up to the last complete object
    let truncatedJson = cleanJson.substring(0, lastCompleteObjectIndex + 1);
    
    // Make sure we close the array properly
    if (!truncatedJson.endsWith(']')) {
      truncatedJson += ']';
    }
    
    console.log('Truncated JSON length:', truncatedJson.length);
    console.log('Truncated JSON ending:', truncatedJson.substring(truncatedJson.length - 100));
    console.log('About to attempt JSON.parse on truncated content...');
    
    // Try to parse the truncated JSON
    const parsedWords = JSON.parse(truncatedJson);
    
    if (!Array.isArray(parsedWords)) {
      return {
        success: false,
        words: [],
        error: 'Recovered data is not an array'
      };
    }
    
    // Validate the recovered words
    const validWords = parsedWords.filter((word, index) => {
      const isValid = word.german && word.type && Array.isArray(word.english) && word.english.length > 0;
      if (!isValid) {
        console.log(`Filtering out invalid word at index ${index}:`, word);
      }
      return isValid;
    });
    
    console.log(`Partial recovery found ${validWords.length} valid words out of ${parsedWords.length} total`);
    
    return {
      success: true,
      words: validWords,
      error: undefined
    };
    
  } catch (error) {
    console.error('Partial recovery failed:', error);
    return {
      success: false,
      words: [],
      error: error instanceof Error ? error.message : 'Unknown error during partial recovery'
    };
  }
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
    const topic = body.topic?.trim();
    let count = body.count || 15;
    
    // Safety check: cap at 50 words to prevent token limit issues
    if (count > 50) {
      console.log(`Capping word count from ${count} to 50 to prevent token limit issues`);
      count = 50;
    }

    console.log('Parsed request body:', {
      topic,
      count
    });
    
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

    const prompt = `Generate ${count} German vocabulary words for "${topic}". Return ONLY a JSON array.

Format: [{"german": "word", "article": "der/die/das or ''", "type": "noun/verb/adjective", "english": ["translation"]}]

Rules:
- Mix of nouns, verbs, adjectives
- Nouns: include article (der/die/das), verbs/adjectives: article = ""
- Base forms only (infinitive verbs, nominative singular nouns)
- Common/basic translations in array
- Intermediate difficulty, no extreme obscure terms
- CRITICAL: "german" field = word only, article in separate "article" field
- Example: {"german": "Koch", "article": "der", "type": "noun", "english": ["cook"]}

Return ONLY the JSON array.`;

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
            maxOutputTokens: 8000,
            candidateCount: 1,
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
    
    // Examine finish_reason to understand why generation stopped
    const finishReason = geminiData.candidates?.[0]?.finishReason;
    console.log('Finish reason:', finishReason);
    
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Generated text length:', generatedText?.length || 0);
    console.log('Generated text preview:', generatedText?.substring(0, 200) + '...');

    if (!generatedText) {
      console.error('No generated text from Gemini');
      console.error('Finish reason was:', finishReason);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'No response content from AI service',
          details: `The AI service returned an empty response. Finish reason: ${finishReason || 'unknown'}`,
          finishReason: finishReason
        }),
      };
    }

    // Parse the JSON response from Gemini
    let parsedWords: CustomWord[];
    let isPartialResult = false;
    
    try {
      console.log('Attempting to parse JSON from AI response...');
      
      // Try to extract JSON array from the response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in response');
        console.error('Full response text:', generatedText);
        console.error('Finish reason was:', finishReason);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid AI response format',
            details: `No JSON array found in AI response. Finish reason: ${finishReason || 'unknown'}`,
            aiResponse: generatedText.substring(0, 500),
            finishReason: finishReason
          }),
        };
      }
      
      console.log('Found JSON match, length:', jsonMatch[0].length);
      
      try {
        parsedWords = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed JSON, word count:', parsedWords.length);
      } catch (parseError) {
        console.log('Initial JSON parsing failed, attempting partial recovery...');
        console.log('Parse error:', parseError);
        console.log('Finish reason was:', finishReason);
        
        // Attempt partial recovery for incomplete JSON
        const partialResult = attemptPartialRecovery(jsonMatch[0], finishReason);
        if (partialResult.success) {
          parsedWords = partialResult.words;
          isPartialResult = true;
          console.log(`Partial recovery successful! Recovered ${parsedWords.length} words from incomplete JSON`);
        } else {
          throw new Error(`JSON parsing failed and partial recovery failed: ${partialResult.error}`);
        }
      }
      
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
      if (isPartialResult) {
        console.log(`⚠️  PARTIAL RESULT: Retrieved ${parsedWords.length} out of ${count} requested words due to incomplete generation`);
      }

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Finish reason was:', finishReason);
      console.error('Raw response:', generatedText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to parse vocabulary list from AI response',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
          aiResponse: generatedText.substring(0, 500),
          finishReason: finishReason
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
      count: uniqueWords.length,
      ...(isPartialResult && { 
        warning: `Partial result: Generated ${uniqueWords.length} out of ${count} requested words`,
        finishReason: finishReason
      })
    };

    console.log('=== Sending successful response ===');
    console.log('Response word count:', response.count);
    console.log('Response structure:', Object.keys(response));
    if (isPartialResult) {
      console.log('⚠️  Response includes partial result warning');
    }

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