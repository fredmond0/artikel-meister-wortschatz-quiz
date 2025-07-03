import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { germanWords, articles, type GermanWord } from '@/data/germanWords';
import { CheckCircle, XCircle, Trophy, Zap } from 'lucide-react';

interface GameState {
  score: number;
  streak: number;
  totalQuestions: number;
  correctAnswers: number;
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
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline">
              {currentWord.difficulty}
            </Badge>
            <Badge variant="secondary">
              #{germanWords.findIndex(w => w.german === currentWord.german) + 1} of 1000
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!showResult && (
            <>
              {/* Article Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">Choose the article:</h3>
                <div className="grid grid-cols-3 gap-3">
                  {articles.map((article) => (
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

              {/* Word Display */}
              <div className="text-center">
                <div className="text-3xl font-bold text-german-black mb-2">
                  {selectedArticle && (
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
                  <span className="text-success">{currentWord.article}</span> {currentWord.german}
                </div>
                <div className="text-muted-foreground">
                  means: <span className="font-medium">{currentWord.english.join(', ')}</span>
                </div>
                {selectedArticle !== currentWord.article && (
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

              <Button 
                variant={isCorrect ? "success" : "default"}
                onClick={nextQuestion}
                className="w-full h-12 text-lg font-semibold"
              >
                Next Word →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}