import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { germanWords, articles, type GermanWord } from '@/data/germanWords';
import { CheckCircle, XCircle, Trophy, Zap, BookOpen, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { 
  type WordProgress, 
  type ProgressSettings, 
  type CustomWord,
  type GameStats,
  loadProgress, 
  loadSettings, 
  saveProgress, 
  updateMasteredWords, 
  updateWordProgress,
  getConsolidatedWords,
  getActiveListsInfo,
  loadGameStats,
  updateGameStats,
  selectSmartWord,
  updateWordHistory
} from '@/lib/progressUtils';

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
  const [currentWord, setCurrentWord] = useState<CustomWord | null>(null);
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
  
  // Word sources and custom lists
  const [consolidatedWords, setConsolidatedWords] = useState<CustomWord[]>([]);
  const [activeListsInfo, setActiveListsInfo] = useState<{totalWords: number; activeListNames: string[]}>(
    { totalWords: 0, activeListNames: [] }
  );
  
  // Review Mode Features
  const [incorrectWords, setIncorrectWords] = useState<CustomWord[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  
  // Persistent Progress Features
  const [wordProgress, setWordProgress] = useState<WordProgress>({});
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<ProgressSettings>({ 
    masteryThreshold: 3,
    repetitionPreference: 50,
    masteredWordsEnabled: false,
    masteredWordsResetDays: 7
  });
  const [gameStats, setGameStats] = useState<GameStats>({
    totalQuestions: 0,
    correctAnswers: 0,
    currentStreak: 0,
    bestStreak: 0,
    articlesCorrect: 0,
    articlesAttempted: 0,
    translationsCorrect: 0,
    translationsAttempted: 0,
    startDate: Date.now(),
    lastPlayed: Date.now()
  });
  
  // Welcome bubbles for first-time visitors
  const [showWelcomeBubbles, setShowWelcomeBubbles] = useState(false);
  
  // Article guessing toggle
  const [guessArticle, setGuessArticle] = useState(true);

  // Generate new question
  const generateQuestion = (forceReviewMode?: boolean) => {
    // Choose word source based on review mode
    let wordSource: CustomWord[];
    
    const effectiveReviewMode = forceReviewMode ?? isReviewMode;
    
    if (effectiveReviewMode && incorrectWords.length > 0) {
      wordSource = incorrectWords;
    } else {
      // Filter out mastered words from normal mode unless they're enabled in settings
      wordSource = consolidatedWords.filter(word => !masteredWords.has(word.german));
      
      // If all words are mastered, use all words (congratulations!)
      if (wordSource.length === 0) {
        wordSource = consolidatedWords;
      }
    }
    
    // If no words available, fall back to default words
    if (wordSource.length === 0) {
      wordSource = germanWords;
    }
    
    // Use smart word selection in normal mode, random in review mode
    const selectedWord = effectiveReviewMode 
      ? wordSource[Math.floor(Math.random() * wordSource.length)]
      : selectSmartWord(wordSource, settings) || wordSource[Math.floor(Math.random() * wordSource.length)];
    
    setCurrentWord(selectedWord);
    
    // Generate wrong choices for translation - filter by same word type for better difficulty
    const sameTypeWords = consolidatedWords.filter(w => 
      w.german !== selectedWord.german && w.type === selectedWord.type
    );
    
    // If we don't have enough words of the same type, fall back to all consolidated words
    const fallbackWords = consolidatedWords.filter(w => w.german !== selectedWord.german);
    const sourceForChoices = sameTypeWords.length >= 3 ? sameTypeWords : fallbackWords;
    
    // If still not enough, fall back to default words
    const finalSource = sourceForChoices.length >= 3 ? sourceForChoices : germanWords.filter(w => w.german !== selectedWord.german);
    
    const wrongChoices = finalSource
      .map(w => w.english[0])
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const allChoices = [selectedWord.english[0], ...wrongChoices].sort(() => Math.random() - 0.5);
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
      
      // Track word progress
      if (currentWord) {
        const newProgress = updateWordProgress(wordProgress, currentWord.german, isTranslationCorrect, undefined, isTranslationCorrect);
        setWordProgress(newProgress);
        saveProgress(newProgress);
        setMasteredWords(updateMasteredWords(newProgress, settings.masteryThreshold));
        
        // Update word history for smart selection
        updateWordHistory(currentWord.german, isTranslationCorrect, settings.masteryThreshold);
      }
      
      // Track incorrect words for review mode
      if (!isTranslationCorrect && currentWord) {
        setIncorrectWords(prev => {
          const exists = prev.some(w => w.german === currentWord.german);
          return exists ? prev : [...prev, currentWord];
        });
      } else if (isTranslationCorrect && currentWord && isReviewMode) {
        // Remove word from incorrect list when answered correctly in review mode
        setIncorrectWords(prev => prev.filter(w => w.german !== currentWord.german));
      }
      
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
      
      // Update persistent game stats
      const newStats = updateGameStats(isTranslationCorrect, gameState.streak + (isTranslationCorrect ? 1 : 0), undefined, isTranslationCorrect);
      setGameStats(newStats);
      return;
    }
    
    // For words with articles - check based on article guessing setting
    if (guessArticle) {
      // Traditional mode: check both article and translation
      if (!article || !translation) return;
      
      const isArticleCorrect = article === currentWord?.article;
      const isTranslationCorrect = translation === currentWord?.english[0];
      const bothCorrect = isArticleCorrect && isTranslationCorrect;
      
      setIsCorrect(bothCorrect);
      setShowResult(true);
      
      // Track word progress
      if (currentWord) {
        const newProgress = updateWordProgress(wordProgress, currentWord.german, bothCorrect, isArticleCorrect, isTranslationCorrect);
        setWordProgress(newProgress);
        saveProgress(newProgress);
        setMasteredWords(updateMasteredWords(newProgress, settings.masteryThreshold));
        
        // Update word history for smart selection
        updateWordHistory(currentWord.german, bothCorrect, settings.masteryThreshold);
      }
      
      // Track incorrect words for review mode
      if (!bothCorrect && currentWord) {
        setIncorrectWords(prev => {
          const exists = prev.some(w => w.german === currentWord.german);
          return exists ? prev : [...prev, currentWord];
        });
      } else if (bothCorrect && currentWord && isReviewMode) {
        // Remove word from incorrect list when answered correctly in review mode
        setIncorrectWords(prev => prev.filter(w => w.german !== currentWord.german));
      }
      
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
      
      // Update persistent game stats
      const newStats = updateGameStats(bothCorrect, gameState.streak + (bothCorrect ? 1 : 0), isArticleCorrect, isTranslationCorrect);
      setGameStats(newStats);
    } else {
      // Article shown mode: only check translation
      if (!translation) return;
      
      const isTranslationCorrect = translation === currentWord?.english[0];
      setIsCorrect(isTranslationCorrect);
      setShowResult(true);
      
      // Track word progress
      if (currentWord) {
        const newProgress = updateWordProgress(wordProgress, currentWord.german, isTranslationCorrect, undefined, isTranslationCorrect);
        setWordProgress(newProgress);
        saveProgress(newProgress);
        setMasteredWords(updateMasteredWords(newProgress, settings.masteryThreshold));
        
        // Update word history for smart selection
        updateWordHistory(currentWord.german, isTranslationCorrect, settings.masteryThreshold);
      }
      
      // Track incorrect words for review mode
      if (!isTranslationCorrect && currentWord) {
        setIncorrectWords(prev => {
          const exists = prev.some(w => w.german === currentWord.german);
          return exists ? prev : [...prev, currentWord];
        });
      } else if (isTranslationCorrect && currentWord && isReviewMode) {
        // Remove word from incorrect list when answered correctly in review mode
        setIncorrectWords(prev => prev.filter(w => w.german !== currentWord.german));
      }
      
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
      
      // Update persistent game stats
      const newStats = updateGameStats(isTranslationCorrect, gameState.streak + (isTranslationCorrect ? 1 : 0), undefined, isTranslationCorrect);
      setGameStats(newStats);
    }
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

  // Start review mode
  const startReviewMode = () => {
    if (incorrectWords.length > 0) {
      setIsReviewMode(true);
      generateQuestion(true); // Force review mode for immediate question generation
    }
  };

  // Exit review mode
  const exitReviewMode = () => {
    setIsReviewMode(false);
    generateQuestion();
  };

  // Clear incorrect words
  const clearIncorrectWords = () => {
    setIncorrectWords([]);
  };

  // Reload consolidated words (useful when custom lists change)
  const reloadConsolidatedWords = () => {
    const defaultWords = germanWords.map(word => ({ ...word }));
    const consolidated = getConsolidatedWords(defaultWords);
    setConsolidatedWords(consolidated);
    
    const listsInfo = getActiveListsInfo(germanWords);
    setActiveListsInfo(listsInfo);
    
    // Generate new question to refresh the game
    generateQuestion();
  };

  // Initialize progress and first question
  useEffect(() => {
    const savedProgress = loadProgress();
    const savedSettings = loadSettings();
    const savedStats = loadGameStats();
    setWordProgress(savedProgress);
    setSettings(savedSettings);
    setGameStats(savedStats);
    setMasteredWords(updateMasteredWords(savedProgress, savedSettings.masteryThreshold));
    
    // Load consolidated words from default + custom lists
    const defaultWords = germanWords.map(word => ({ ...word }));
    const consolidated = getConsolidatedWords(defaultWords);
    setConsolidatedWords(consolidated);
    
    // Load active lists info
    const listsInfo = getActiveListsInfo(germanWords);
    setActiveListsInfo(listsInfo);
    
    // Check if this is the first visit of the session
    const sessionKey = 'artikel-meister-session-welcome';
    const hasSeenWelcome = sessionStorage.getItem(sessionKey);
    
    if (!hasSeenWelcome) {
      setShowWelcomeBubbles(true);
      sessionStorage.setItem(sessionKey, 'true');
      
      // Hide welcome bubbles after 4 seconds
      setTimeout(() => {
        setShowWelcomeBubbles(false);
      }, 4000);
    }
    
    // Generate first question after loading progress and words
    setTimeout(() => {
      generateQuestion();
    }, 100);
  }, []);

  // Auto-exit review mode when all words are mastered
  useEffect(() => {
    if (isReviewMode && incorrectWords.length === 0) {
      setTimeout(() => {
        setIsReviewMode(false);
      }, 1000); // Small delay to let user see the completion
    }
  }, [isReviewMode, incorrectWords.length]);

  // Reload consolidated words when window regains focus (in case user changed custom lists)
  useEffect(() => {
    const handleFocus = () => {
      const defaultWords = germanWords.map(word => ({ ...word }));
      const consolidated = getConsolidatedWords(defaultWords);
      setConsolidatedWords(consolidated);
      
      const listsInfo = getActiveListsInfo(germanWords);
      setActiveListsInfo(listsInfo);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  if (!currentWord) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Stats */}
      <div className="flex justify-between items-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-german-gold/20 rounded-full">
            <Trophy className="h-5 w-5 text-german-gold" />
          </div>
          <span className="font-bold text-lg text-german-black">{gameState.score}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/20 rounded-full">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <Badge variant={gameState.streak > 0 ? "default" : "secondary"} className="font-semibold">
            {gameState.streak} streak
          </Badge>
        </div>
        <button 
          onClick={() => setGuessArticle(!guessArticle)}
          className="flex items-center gap-1 text-sm font-medium text-german-black hover:text-primary transition-colors"
        >
          {guessArticle ? (
            <>
              <ToggleRight className="h-4 w-4" />
              <span>Article</span>
            </>
          ) : (
            <>
              <ToggleLeft className="h-4 w-4 opacity-50" />
              <span className="opacity-50">Article</span>
            </>
          )}
        </button>
      </div>

      {/* Progress & Review Mode Controls */}
      <div className="space-y-2">
        {/* Welcome Bubbles (first session only) */}
        {showWelcomeBubbles && (
          <div className="space-y-2 animate-in fade-in-0 duration-500">
            {/* Progress Stats Bubble */}
            <div className="flex items-center justify-center p-3 bg-german-gold/10 rounded-lg border border-german-gold/20 animate-bounce">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-german-gold/20 rounded">
                  <Trophy className="h-4 w-4 text-german-gold" />
                </div>
                <span className="text-sm font-semibold text-german-black">
                  {masteredWords.size} / {consolidatedWords.length > 0 ? consolidatedWords.length : germanWords.length} words mastered
                </span>
              </div>
            </div>
            
            {/* Active Lists Info Bubble */}
            {activeListsInfo.activeListNames.length > 0 && (
              <div className="flex items-center justify-center p-2 bg-blue-50 rounded-lg border border-blue-200 animate-pulse">
                <div className="text-xs text-blue-700 text-center">
                  <div className="font-semibold">Active Lists:</div>
                  <div>{activeListsInfo.activeListNames.join(', ')}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Review Mode Controls */}
        <div className="flex gap-2 justify-center">
          {!isReviewMode && incorrectWords.length > 0 && (
            <Button 
              variant="outline" 
              onClick={startReviewMode}
              className="flex items-center gap-2 bg-german-red/10 border-german-red/30 hover:bg-german-red/20 text-german-red font-semibold"
            >
              <BookOpen className="h-4 w-4" />
              Review ({incorrectWords.length} words)
            </Button>
          )}
          
          {isReviewMode && (
            <div className="flex gap-2">
              <Badge variant="destructive" className="px-3 py-1 bg-german-red">
                Review Mode: {incorrectWords.length} words remaining
              </Badge>
              <Button 
                variant="outline" 
                onClick={exitReviewMode}
                className="text-sm h-8 px-3"
              >
                Exit Review
              </Button>
              {incorrectWords.length === 0 && (
                <Button 
                  variant="outline" 
                  onClick={clearIncorrectWords}
                  className="text-sm h-8 px-3"
                >
                  Clear All
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Game Card */}
      <Card className="bg-gradient-background border-2 border-german-gold/30 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center">
            <Badge 
              variant="outline" 
              className="px-4 py-2 rounded-full text-sm font-semibold bg-german-gold/10 border-german-gold/30 text-german-black uppercase tracking-wide"
            >
              {currentWord.type}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!showResult && (
            <>
              {/* Article Selection - Only show if word has an article AND guessArticle is true */}
              {currentWord.article && currentWord.article.trim() !== '' && guessArticle && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center text-german-black">Wähle den Artikel:</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {articles.filter(article => article !== '').map((article) => (
                      <Button
                        key={article}
                        variant="article"
                        className={`h-16 font-bold text-lg transition-all duration-200 ${
                          selectedArticle === article 
                            ? 'ring-2 ring-blue-500 shadow-lg scale-105 bg-blue-600 text-white' 
                            : 'hover:scale-102 hover:shadow-md'
                        }`}
                        onClick={() => handleArticleSelect(article)}
                      >
                        {article}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Word Display */}
              <div className="text-center p-6 bg-white/40 rounded-xl border border-german-gold/20">
                <div className="text-4xl font-bold text-german-black mb-3 tracking-wide">
                  {currentWord.article && currentWord.article.trim() !== '' && guessArticle && selectedArticle && (
                    <span className={selectedArticle === currentWord.article ? 'text-success' : 'text-destructive'}>
                      {selectedArticle}{' '}
                    </span>
                  )}
                  {currentWord.article && currentWord.article.trim() !== '' && !guessArticle && (
                    <span className="text-german-black">
                      {currentWord.article}{' '}
                    </span>
                  )}
                  <span className="text-german-red">{currentWord.german}</span>
                </div>
                <p className="text-german-black/70 font-medium">Was bedeutet das auf Englisch?</p>
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
                    {currentWord && masteredWords.has(currentWord.german) && 
                     wordProgress[currentWord.german]?.correctCount === settings.masteryThreshold ? (
                      <span className="text-german-gold">🎉 Word Mastered!</span>
                    ) : (
                      'Perfect!'
                    )}
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
                
                {/* Progress indicator */}
                {currentWord && wordProgress[currentWord.german] && (
                  <div className="text-xs text-muted-foreground">
                    Progress: {wordProgress[currentWord.german].correctCount}/{settings.masteryThreshold} correct
                    {masteredWords.has(currentWord.german) && (
                      <span className="ml-2 text-german-gold">✨ Mastered!</span>
                    )}
                  </div>
                )}
                
                {currentWord.article && currentWord.article.trim() !== '' && guessArticle && selectedArticle !== currentWord.article && (
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
                <div className="space-y-3 p-4 bg-german-gold/5 border border-german-gold/20 rounded-xl shadow-sm">
                  <h4 className="font-semibold text-german-black flex items-center gap-2">
                    <div className="p-1 bg-german-gold/20 rounded">
                      <BookOpen className="h-4 w-4 text-german-gold" />
                    </div>
                    Beispielsatz (Example Sentence)
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="p-4 bg-white/80 rounded-lg border border-german-gold/10 shadow-sm">
                      <p className="font-semibold text-german-black text-lg">{sentenceData.sentence}</p>
                      <p className="text-sm text-german-black/70 mt-2 italic">{sentenceData.translation}</p>
                    </div>
                    
                    {sentenceData.conjugation && (
                      <div className="p-3 bg-success/5 rounded-lg border border-success/20">
                        <h5 className="font-semibold text-success mb-2 flex items-center gap-1">
                          📝 Konjugation:
                        </h5>
                        <p className="text-sm text-success/80 font-mono">{sentenceData.conjugation}</p>
                      </div>
                    )}
                    
                    {sentenceData.grammar_note && (
                      <div className="p-3 bg-german-gold/10 rounded-lg border border-german-gold/30">
                        <h5 className="font-semibold text-german-black mb-2 flex items-center gap-1">
                          💡 Grammatik-Tipp:
                        </h5>
                        <p className="text-sm text-german-black/80">{sentenceData.grammar_note}</p>
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
                  className="w-full h-12 text-lg font-semibold border-german-gold/30 hover:bg-german-gold/10 transition-all duration-200"
                >
                  {loadingSentence ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Beispielsatz anzeigen
                    </>
                  )}
                </Button>

                <Button 
                  variant={isCorrect ? "success" : "default"}
                  onClick={nextQuestion}
                  className="w-full h-12 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-all duration-200 shadow-lg"
                >
                  Nächstes Wort →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}