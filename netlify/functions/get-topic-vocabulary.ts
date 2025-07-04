import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST' || !event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid request' }),
    };
  }

  try {
    const { topic, count = 15 }: RequestBody = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    if (!topic?.trim() || count < 5 || count > 50) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid input parameters.' }),
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Generate a JSON array of ${count} German vocabulary words for "${topic}".
Format: [{"german": "Wort", "article": "das", "type": "noun", "english": ["word"]}]
- Nouns must have an article ('der', 'die', 'das').
- Verbs and adjectives must have an empty string '' for the article.
- Return ONLY the raw JSON array, with no markdown formatting.`;

    const streamingResult = await model.generateContentStream(prompt);

    let combinedResult = '';
    for await (const chunk of streamingResult.stream) {
      combinedResult += chunk.text();
    }

    // Clean the response to ensure it's a valid JSON array
    const jsonMatch = combinedResult.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in AI response.');
    }
    const words: CustomWord[] = JSON.parse(jsonMatch[0]);

    const responsePayload: TopicVocabularyResponse = {
      topic,
      words,
      difficulty: 'intermediate',
      count: words.length,
      warning: words.length < count ? `Returned ${words.length} of ${count} requested words.` : undefined,
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responsePayload),
    };

  } catch (error) {
    console.error('Error in get-topic-vocabulary function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate vocabulary.',
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}; 