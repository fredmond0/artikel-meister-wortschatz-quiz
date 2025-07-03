import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { germanWords, articles, type GermanWord } from '@/data/germanWords';
import { CheckCircle, XCircle, Trophy, Zap, BookOpen, Loader2 } from 'lucide-react';

interface GameState {
  score: number;
  streak: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface SentenceData {
  sentence: string;
  translation: string;
  conjugation?: string;
  grammar_note?: string;
}

export function GameCard() {
  const [currentWord, setCurrentWord] = useState<GermanWord | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    streak: 0,
    totalQuestions: 0,
    correctAnswers: 0
  });
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sentenceData, setSentenceData] = useState<SentenceData | null>(null);
  const [loadingSentence, setLoadingSentence] = useState(false);
  const [sentenceError, setSentenceError] = useState<string | null>(null);

  // Generate new question
  const generateQuestion = () => {
    const randomWord = germanWords[Math.floor(Math.random() * germanWords.length)];
    setCurrentWord(randomWord);
    
    // Generate wrong choices for translation
    const wrongChoices = germanWords
      .filter(w => w.german !== randomWord.german)
      .map(w => w.english[0])
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const allChoices = [randomWord.english[0], ...wrongChoices].sort(() => Math.random() - 0.5);
    setChoices(allChoices);
    
    // Reset state
    setSelectedArticle(null);
    setSelectedChoice(null);
    setShowResult(false);
    setSentenceData(null);
    setSentenceError(null);
    setLoadingSentence(false);
  };

  // Handle article selection
  const handleArticleSelect = (article: string) => {
    setSelectedArticle(article);
    checkAnswer(article, selectedChoice);
  };

  // Handle translation selection
  const handleTranslationSelect = (choice: string) => {
    setSelectedChoice(choice);
    checkAnswer(selectedArticle, choice);
  };

  // Check if both selections are made and process answer
  const checkAnswer = (article: string | null, translation: string | null) => {
    const wordHasArticle = currentWord?.article && currentWord.article.trim() !== '';
    
    // For words without articles, only check translation
    if (!wordHasArticle) {
      if (!translation) return;
      
      const isTranslationCorrect = translation === currentWord?.english[0];
      setIsCorrect(isTranslationCorrect);
      setShowResult(true);
      
      // Update game state
      setGameState(prev => {
        const newStreak = isTranslationCorrect ? prev.streak + 1 : 0;
        const points = isTranslationCorrect ? (10 + newStreak * 2) : 0;
        
        return {
          score: prev.score + points,
          streak: newStreak,
          totalQuestions: prev.totalQuestions + 1,
          correctAnswers: prev.correctAnswers + (isTranslationCorrect ? 1 : 0)
        };
      });
      return;
    }
    
    // For words with articles, check both article and translation
    if (!article || !translation) return;
    
    const isArticleCorrect = article === currentWord?.article;
    const isTranslationCorrect = translation === currentWord?.english[0];
    const bothCorrect = isArticleCorrect && isTranslationCorrect;
    
    setIsCorrect(bothCorrect);
    setShowResult(true);
    
    // Update game state
    setGameState(prev => {
      const newStreak = bothCorrect ? prev.streak + 1 : 0;
      const points = bothCorrect ? (10 + newStreak * 2) : 0;
      
      return {
        score: prev.score + points,
        streak: newStreak,
        totalQuestions: prev.totalQuestions + 1,
        correctAnswers: prev.correctAnswers + (bothCorrect ? 1 : 0)
      };
    });
  };

  // Fetch example sentence from AI
  const fetchExampleSentence = async () => {
    if (!currentWord) return;

    setLoadingSentence(true);
    setSentenceError(null);

    try {
      const response = await fetch('/.netlify/functions/get-sentence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          german: currentWord.german,
          type: currentWord.type,
          english: currentWord.english,
          article: currentWord.article,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SentenceData = await response.json();
      setSentenceData(data);
    } catch (error) {
      console.error('Error fetching sentence:', error);
      setSentenceError('Failed to generate example sentence. Please try again.');
    } finally {
      setLoadingSentence(false);
    }
  };

  // Start new round
  const nextQuestion = () => {
    generateQuestion();
  };

  // Initialize first question
  useEffect(() => {
    generateQuestion();
  }, []);

  if (!currentWord) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Stats */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-german-gold" />
          <span className="font-bold text-lg">{gameState.score}</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <Badge variant={gameState.streak > 0 ? "default" : "secondary"}>
            {gameState.streak} streak
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {gameState.correctAnswers}/{gameState.totalQuestions}
        </div>
      </div>

      {/* Main Game Card */}
      <Card className="bg-gradient-background border-2">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center">
            <Badge variant="outline" className="px-3 py-1 rounded-full">
              {currentWord.type}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!showResult && (
            <>
              {/* Article Selection - Only show if word has an article */}
              {currentWord.article && currentWord.article.trim() !== '' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center">Choose the article:</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {articles.filter(article => article !== '').map((article) => (
                      <Button
                        key={article}
                        variant="article"
                        className={`h-16 ${selectedArticle === article ? 'ring-2 ring-ring' : ''}`}
                        onClick={() => handleArticleSelect(article)}
                      >
                        {article}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Word Display */}
              <div className="text-center">
                <div className="text-3xl font-bold text-german-black mb-2">
                  {currentWord.article && currentWord.article.trim() !== '' && selectedArticle && (
                    <span className={selectedArticle === currentWord.article ? 'text-success' : 'text-destructive'}>
                      {selectedArticle}{' '}
                    </span>
                  )}
                  {currentWord.german}
                </div>
                <p className="text-muted-foreground">What does this mean in English?</p>
              </div>

              {/* Translation Selection */}
              <div className="space-y-3">
                {choices.map((choice, index) => (
                  <Button
                    key={index}
                    variant="choice"
                    className={`w-full justify-start h-auto min-h-[3rem] ${
                      selectedChoice === choice ? 'ring-2 ring-ring' : ''
                    }`}
                    onClick={() => handleTranslationSelect(choice)}
                  >
                    {choice}
                  </Button>
                ))}
              </div>
            </>
          )}

          {/* Result Phase */}
          {showResult && (
            <div className="space-y-4 text-center">
              <div className={`flex items-center justify-center gap-2 text-xl font-bold ${
                isCorrect ? 'text-success' : 'text-destructive'
              }`}>
                {isCorrect ? (
                  <>
                    <CheckCircle className="h-6 w-6 animate-bounce-in" />
                    Perfect!
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 animate-shake" />
                    Not quite!
                  </>
                )}
              </div>
              
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="font-semibold">
                  {currentWord.article && currentWord.article.trim() !== '' && (
                    <span className="text-success">{currentWord.article} </span>
                  )}
                  {currentWord.german}
                </div>
                <div className="text-muted-foreground">
                  means: <span className="font-medium">{currentWord.english.join(', ')}</span>
                </div>
                {currentWord.article && currentWord.article.trim() !== '' && selectedArticle !== currentWord.article && (
                  <div className="text-sm text-destructive">
                    You chose: {selectedArticle} (incorrect article)
                  </div>
                )}
                {selectedChoice !== currentWord.english[0] && (
                  <div className="text-sm text-destructive">
                    You chose: {selectedChoice} (incorrect translation)
                  </div>
                )}
              </div>

              {/* Example Sentence Display */}
              {sentenceError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{sentenceError}</p>
                </div>
              )}

              {sentenceData && (
                <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Example Sentence
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-white rounded border">
                      <p className="font-medium text-gray-900">{sentenceData.sentence}</p>
                      <p className="text-sm text-gray-600 mt-1">{sentenceData.translation}</p>
                    </div>
                    
                    {sentenceData.conjugation && (
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <h5 className="font-medium text-green-800 mb-1">Conjugation:</h5>
                        <p className="text-sm text-green-700">{sentenceData.conjugation}</p>
                      </div>
                    )}
                    
                    {sentenceData.grammar_note && (
                      <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                        <h5 className="font-medium text-yellow-800 mb-1">Grammar Note:</h5>
                        <p className="text-sm text-yellow-700">{sentenceData.grammar_note}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button 
                  variant="outline"
                  onClick={fetchExampleSentence}
                  disabled={loadingSentence}
                  className="w-full h-12 text-lg font-semibold"
                >
                  {loadingSentence ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Show Example Sentence
                    </>
                  )}
                </Button>

                <Button 
                  variant={isCorrect ? "success" : "default"}
                  onClick={nextQuestion}
                  className="w-full h-12 text-lg font-semibold"
                >
                  Next Word →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}