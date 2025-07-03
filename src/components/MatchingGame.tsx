import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { germanWords, type GermanWord } from '@/data/germanWords';
import { Trophy, Zap, CheckCircle } from 'lucide-react';

interface MatchingGameState {
  score: number;
  streak: number;
  completedPairs: number;
}

interface WordPair {
  id: string;
  german: string;
  english: string;
  article: string;
  matched: boolean;
  fadeOut: boolean;
}

export function MatchingGame() {
  const [wordPairs, setWordPairs] = useState<WordPair[]>([]);
  const [selectedGerman, setSelectedGerman] = useState<string | null>(null);
  const [selectedEnglish, setSelectedEnglish] = useState<string | null>(null);
  const [gameState, setGameState] = useState<MatchingGameState>({
    score: 0,
    streak: 0,
    completedPairs: 0
  });
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());

  // Generate initial word pairs
  const generateWordPairs = () => {
    const shuffledWords = [...germanWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(0, 6);
    
    const pairs: WordPair[] = selectedWords.map((word, index) => ({
      id: `pair-${index}`,
      german: word.german,
      english: word.english[0],
      article: word.article,
      matched: false,
      fadeOut: false
    }));

    setWordPairs(pairs);
  };

  // Handle word selection
  const handleGermanSelect = (pairId: string, german: string) => {
    if (matchedPairs.has(pairId)) return;
    setSelectedGerman(pairId);
    checkMatch(pairId, selectedEnglish);
  };

  const handleEnglishSelect = (pairId: string, english: string) => {
    if (matchedPairs.has(pairId)) return;
    setSelectedEnglish(pairId);
    checkMatch(selectedGerman, pairId);
  };

  // Check for match
  const checkMatch = (germanId: string | null, englishId: string | null) => {
    if (!germanId || !englishId) return;

    if (germanId === englishId) {
      // Correct match!
      setMatchedPairs(prev => new Set(prev).add(germanId));
      
      // Start fade out animation
      setWordPairs(prev => prev.map(pair => 
        pair.id === germanId ? { ...pair, fadeOut: true } : pair
      ));

      // Update game state
      setGameState(prev => ({
        score: prev.score + (10 + prev.streak * 2),
        streak: prev.streak + 1,
        completedPairs: prev.completedPairs + 1
      }));

      // Remove matched pair after animation and add new one if needed
      setTimeout(() => {
        setWordPairs(prev => {
          const remainingPairs = prev.filter(pair => pair.id !== germanId);
          
          // If we have less than 6 pairs, add a new one
          if (remainingPairs.length < 6) {
            const availableWords = germanWords.filter(word => 
              !remainingPairs.some(pair => pair.german === word.german)
            );
            
            if (availableWords.length > 0) {
              const newWord = availableWords[Math.floor(Math.random() * availableWords.length)];
              const newPair: WordPair = {
                id: `pair-${Date.now()}`,
                german: newWord.german,
                english: newWord.english[0],
                article: newWord.article,
                matched: false,
                fadeOut: false
              };
              return [...remainingPairs, newPair];
            }
          }
          
          return remainingPairs;
        });
      }, 500);

      // Reset selections
      setSelectedGerman(null);
      setSelectedEnglish(null);
    } else {
      // Wrong match - reset after a brief moment
      setTimeout(() => {
        setSelectedGerman(null);
        setSelectedEnglish(null);
      }, 1000);
      
      setGameState(prev => ({ ...prev, streak: 0 }));
    }
  };

  // Initialize game
  useEffect(() => {
    generateWordPairs();
  }, []);

  // Shuffle arrays for display
  const germanWords = wordPairs.sort(() => Math.random() - 0.5);
  const englishWords = [...wordPairs].sort(() => Math.random() - 0.5);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
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
          {gameState.completedPairs} pairs matched
        </div>
      </div>

      {/* Main Game Card */}
      <Card className="bg-gradient-background border-2">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-german-black">
            Tap the matching pairs
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* German Column */}
            <div className="space-y-3">
              {germanWords.map((pair) => (
                <Button
                  key={`german-${pair.id}`}
                  variant="choice"
                  className={`w-full h-16 text-lg transition-all duration-500 ${
                    pair.fadeOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  } ${
                    selectedGerman === pair.id ? 'ring-2 ring-primary' : ''
                  } ${
                    matchedPairs.has(pair.id) ? 'bg-success text-success-foreground' : ''
                  }`}
                  onClick={() => handleGermanSelect(pair.id, pair.german)}
                  disabled={matchedPairs.has(pair.id)}
                >
                  {matchedPairs.has(pair.id) ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      {pair.article} {pair.german}
                    </div>
                  ) : (
                    `${pair.article} ${pair.german}`
                  )}
                </Button>
              ))}
            </div>

            {/* English Column */}
            <div className="space-y-3">
              {englishWords.map((pair) => (
                <Button
                  key={`english-${pair.id}`}
                  variant="choice"
                  className={`w-full h-16 text-lg transition-all duration-500 ${
                    pair.fadeOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  } ${
                    selectedEnglish === pair.id ? 'ring-2 ring-primary' : ''
                  } ${
                    matchedPairs.has(pair.id) ? 'bg-success text-success-foreground' : ''
                  }`}
                  onClick={() => handleEnglishSelect(pair.id, pair.english)}
                  disabled={matchedPairs.has(pair.id)}
                >
                  {matchedPairs.has(pair.id) ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      {pair.english}
                    </div>
                  ) : (
                    pair.english
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}