import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { germanWords, type GermanWord } from '@/data/germanWords';
import { Trophy, Target, BarChart3, Settings, Trash2, Download, Upload, BookOpen, Flame, ArrowLeft, ListChecks, Shuffle, RefreshCw, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { 
  type WordProgress, 
  type ProgressSettings, 
  type CustomWord,
  type GameStats,
  loadProgress, 
  loadSettings, 
  saveSettings, 
  updateMasteredWords, 
  resetAllProgress,
  getConsolidatedWords,
  getActiveListsInfo,
  loadGameStats,
  getWordSelectionStats,
  resetMasteredWords,
  resetAllWordHistory,
  STORAGE_KEY,
  SETTINGS_KEY
} from '@/lib/progressUtils';

export function Progress() {
  const navigate = useNavigate();
  const [wordProgress, setWordProgress] = useState<WordProgress>({});
  const [settings, setSettings] = useState<ProgressSettings>({ 
    masteryThreshold: 3,
    repetitionPreference: 50,
    masteredWordsEnabled: false,
    masteredWordsResetDays: 7
  });
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());
  const [consolidatedWords, setConsolidatedWords] = useState<CustomWord[]>([]);
  const [activeListsInfo, setActiveListsInfo] = useState<{totalWords: number; activeListNames: string[]}>(
    { totalWords: 0, activeListNames: [] }
  );
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

  // Load progress and settings
  useEffect(() => {
    const savedProgress = loadProgress();
    const savedSettings = loadSettings();
    const savedStats = loadGameStats();
    setWordProgress(savedProgress);
    setSettings(savedSettings);
    setGameStats(savedStats);
    setMasteredWords(updateMasteredWords(savedProgress, savedSettings.masteryThreshold));
    
    // Load consolidated words
    const defaultWords = germanWords.map(word => ({ ...word }));
    const consolidated = getConsolidatedWords(defaultWords);
    setConsolidatedWords(consolidated);
    
    // Load active lists info
    const listsInfo = getActiveListsInfo(germanWords);
    setActiveListsInfo(listsInfo);
  }, []);

  const handleSettingsChange = (newSettings: ProgressSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
    setMasteredWords(updateMasteredWords(wordProgress, newSettings.masteryThreshold));
  };

  const handleResetProgress = () => {
    resetAllProgress();
    setWordProgress({});
    setMasteredWords(new Set());
    // Page will reload to reflect changes
    window.location.reload();
  };

  const exportProgress = () => {
    const data = {
      progress: wordProgress,
      settings: settings,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artikel-meister-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProgress = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.progress && data.settings) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.progress));
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
          setWordProgress(data.progress);
          setSettings(data.settings);
          setMasteredWords(updateMasteredWords(data.progress, data.settings.masteryThreshold));
        }
      } catch (error) {
        console.error('Failed to import progress:', error);
      }
    };
    reader.readAsText(file);
  };

  // Statistics calculations
  const totalWords = consolidatedWords.length > 0 ? consolidatedWords.length : germanWords.length;
  const masteredCount = masteredWords.size;
  const wordsInProgress = Object.keys(wordProgress).length - masteredCount;
  const wordsNotStarted = totalWords - Object.keys(wordProgress).length;
  const completionPercentage = Math.round((masteredCount / totalWords) * 100);

  const getWordsByCategory = () => {
    const categories = {
      mastered: [] as Array<{ word: CustomWord; progress: any }>,
      inProgress: [] as Array<{ word: CustomWord; progress: any }>,
      notStarted: [] as CustomWord[]
    };

    const wordsToCheck = consolidatedWords.length > 0 ? consolidatedWords : germanWords;

    wordsToCheck.forEach(word => {
      const progress = wordProgress[word.german];
      if (!progress) {
        categories.notStarted.push(word);
      } else if (progress.correctCount >= settings.masteryThreshold) {
        categories.mastered.push({ word, progress });
      } else {
        categories.inProgress.push({ word, progress });
      }
    });

    return categories;
  };

  const wordsByCategory = getWordsByCategory();

  const getStreakInfo = () => {
    const today = new Date();
    const daysWithProgress = new Set<string>();
    
    Object.values(wordProgress).forEach(progress => {
      const date = new Date(progress.lastSeen);
      daysWithProgress.add(date.toDateString());
    });

    return {
      daysStudied: daysWithProgress.size,
      totalQuestions: Object.values(wordProgress).reduce((sum, p) => sum + p.totalSeen, 0)
    };
  };

  const streakInfo = getStreakInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-full">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Learning Progress</h1>
              <p className="text-gray-600">Track your German vocabulary mastery</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quiz
          </Button>
        </div>

        <Tabs defaultValue="statistics" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="statistics">Learning Statistics</TabsTrigger>
            <TabsTrigger value="settings">Settings & Data</TabsTrigger>
          </TabsList>

          <TabsContent value="statistics" className="space-y-4">
            {/* Progress Dashboard - Primary Summary */}
            <Card className="border-indigo-300 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-indigo-600" />
                  Progress Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Words Mastered</span>
                      <span>{masteredCount} / {totalWords} ({completionPercentage}%)</span>
                    </div>
                    <ProgressBar value={completionPercentage} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-xl font-bold text-yellow-600">{masteredCount}</div>
                      <div className="text-xs text-gray-600">Mastered</div>
                      {masteredCount > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs">
                              <ListChecks className="h-3 w-3 mr-1" />
                              View List
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Mastered Words ({masteredCount})</AlertDialogTitle>
                              <AlertDialogDescription>
                                These are the words you've successfully mastered with {settings.masteryThreshold} or more correct answers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
                              {wordsByCategory.mastered.map(({ word, progress }) => (
                                <div key={word.german} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                  <div className="flex-1">
                                    <div className="font-medium text-green-800">
                                      {word.article} {word.german}
                                    </div>
                                    <div className="text-sm text-green-600">{word.english}</div>
                                  </div>
                                  <div className="text-xs text-green-500">
                                    {progress.correctCount}/{progress.totalSeen}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogAction>Close</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-xl font-bold text-blue-600">{wordsInProgress}</div>
                      <div className="text-xs text-gray-600">In Progress</div>
                      {wordsInProgress > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs">
                              <ListChecks className="h-3 w-3 mr-1" />
                              View List
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Words In Progress ({wordsInProgress})</AlertDialogTitle>
                              <AlertDialogDescription>
                                These are words you've started learning but haven't yet mastered (need {settings.masteryThreshold} correct answers).
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
                              {wordsByCategory.inProgress.map(({ word, progress }) => (
                                <div key={word.german} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="flex-1">
                                    <div className="font-medium text-blue-800">
                                      {word.article} {word.german}
                                    </div>
                                    <div className="text-sm text-blue-600">{word.english}</div>
                                  </div>
                                  <div className="text-xs text-blue-500">
                                    {progress.correctCount}/{progress.totalSeen}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogAction>Close</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xl font-bold text-gray-600">{wordsNotStarted}</div>
                      <div className="text-xs text-gray-600">Not Started</div>
                      {wordsNotStarted > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs">
                              <ListChecks className="h-3 w-3 mr-1" />
                              View List
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Words Not Started ({wordsNotStarted})</AlertDialogTitle>
                              <AlertDialogDescription>
                                These are words you haven't encountered yet in the quiz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
                              {wordsByCategory.notStarted.map((word) => (
                                <div key={word.german} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-800">
                                      {word.article} {word.german}
                                    </div>
                                    <div className="text-sm text-gray-600">{word.english}</div>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    New
                                  </div>
                                </div>
                              ))}
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogAction>Close</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>

                  {masteredCount > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">🎉 Great Progress!</h4>
                      <p className="text-sm text-green-700">
                        You've mastered {masteredCount} words and answered {gameStats.totalQuestions} questions! 
                        {gameStats.bestStreak > 5 && ` Your best streak is ${gameStats.bestStreak} - amazing!`}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active Word Lists */}
            {activeListsInfo.activeListNames.length > 0 && (
              <Card className="border-blue-300 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Active Word Lists
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-blue-600 font-medium">
                      Total Words: {activeListsInfo.totalWords}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeListsInfo.activeListNames.map((name, index) => (
                        <Badge key={index} variant="outline" className="text-blue-600 border-blue-300">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Game Performance Stats */}
            <Card className="border-green-300 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Game Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{gameStats.totalQuestions}</div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{gameStats.correctAnswers}</div>
                    <div className="text-sm text-gray-600">Correct Answers</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-600">{gameStats.bestStreak}</div>
                    <div className="text-sm text-gray-600">Best Streak</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">
                      {gameStats.totalQuestions > 0 ? Math.round((gameStats.correctAnswers / gameStats.totalQuestions) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Overall Accuracy</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accuracy Breakdown */}
            <Card className="border-blue-300 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Accuracy Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Article Accuracy</span>
                      <span className="text-sm text-gray-600">
                        {gameStats.articlesAttempted > 0 ? Math.round((gameStats.articlesCorrect / gameStats.articlesAttempted) * 100) : 0}%
                      </span>
                    </div>
                    <ProgressBar 
                      value={gameStats.articlesAttempted > 0 ? (gameStats.articlesCorrect / gameStats.articlesAttempted) * 100 : 0} 
                      className="h-2" 
                    />
                    <div className="text-xs text-gray-500">
                      {gameStats.articlesCorrect} correct out of {gameStats.articlesAttempted} attempts
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Translation Accuracy</span>
                      <span className="text-sm text-gray-600">
                        {gameStats.translationsAttempted > 0 ? Math.round((gameStats.translationsCorrect / gameStats.translationsAttempted) * 100) : 0}%
                      </span>
                    </div>
                    <ProgressBar 
                      value={gameStats.translationsAttempted > 0 ? (gameStats.translationsCorrect / gameStats.translationsAttempted) * 100 : 0} 
                      className="h-2" 
                    />
                    <div className="text-xs text-gray-500">
                      {gameStats.translationsCorrect} correct out of {gameStats.translationsAttempted} attempts
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings & Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="learning-settings">
                    <AccordionTrigger className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Learning Settings
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mastery Threshold</label>
                        <Select
                          value={settings.masteryThreshold.toString()}
                          onValueChange={(value) => handleSettingsChange({ ...settings, masteryThreshold: parseInt(value) })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 correct answers</SelectItem>
                            <SelectItem value="3">3 correct answers (default)</SelectItem>
                            <SelectItem value="4">4 correct answers</SelectItem>
                            <SelectItem value="5">5 correct answers</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                          Number of correct answers needed to mark a word as mastered
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Include Mastered Words</label>
                          <Switch
                            checked={settings.masteredWordsEnabled}
                            onCheckedChange={(checked) => handleSettingsChange({ ...settings, masteredWordsEnabled: checked })}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Allow mastered words to appear in quiz after a delay
                        </p>
                        
                        {settings.masteredWordsEnabled && (
                          <div className="pl-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Reset After Days</label>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {settings.masteredWordsResetDays}
                              </span>
                            </div>
                            <Slider
                              value={[settings.masteredWordsResetDays]}
                              onValueChange={(value) => handleSettingsChange({ ...settings, masteredWordsResetDays: value[0] })}
                              max={30}
                              min={1}
                              step={1}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>1 day</span>
                              <span>30 days</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Mastered words can reappear after {settings.masteredWordsResetDays} day{settings.masteredWordsResetDays !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Current Settings Summary</h4>
                        <div className="text-sm text-gray-600">
                          <p>• Mastery requires {settings.masteryThreshold} correct answers</p>
                          <p>• {masteredCount} words currently mastered</p>
                          <p>• {wordsInProgress} words in progress</p>
                          <p>• Mastered words: {settings.masteredWordsEnabled ? `included after ${settings.masteredWordsResetDays} days` : 'excluded'}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="smart-selection">
                    <AccordionTrigger className="flex items-center gap-2">
                      <Shuffle className="h-4 w-4" />
                      Smart Word Selection
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Repetition Preference</label>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {settings.repetitionPreference}%
                          </span>
                        </div>
                        <Slider
                          value={[settings.repetitionPreference]}
                          onValueChange={(value) => handleSettingsChange({ ...settings, repetitionPreference: value[0] })}
                          max={100}
                          min={0}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Max Variety
                          </span>
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            Max Repetition
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {settings.repetitionPreference <= 20 ? "Focus on fresh words and maximum variety" :
                           settings.repetitionPreference <= 40 ? "Balanced approach with some repetition" :
                           settings.repetitionPreference <= 60 ? "Moderate repetition of recent words" :
                           settings.repetitionPreference <= 80 ? "High repetition for reinforcement" :
                           "Maximum repetition of recent and incorrect words"}
                        </p>
                      </div>

                      <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-2">How Smart Selection Works</h4>
                        <p className="text-blue-700 mb-2">
                          The quiz intelligently chooses which words to show you based on your learning history and preferences. 
                          At <strong>0% (Max Variety)</strong>, it focuses on showing you new words you haven't seen before to maximize exposure. 
                          At <strong>100% (Max Repetition)</strong>, it prioritizes words you recently got wrong or need more practice with.
                        </p>
                        <p className="text-blue-600 text-xs">
                          The algorithm balances between introducing fresh vocabulary and reinforcing challenging words to optimize your learning.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Word Selection Statistics</h4>
                        {(() => {
                          const stats = getWordSelectionStats(consolidatedWords);
                          return (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="text-lg font-bold text-red-600">{stats.incorrect}</div>
                                <div className="text-xs text-gray-600">Recently Incorrect</div>
                              </div>
                              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="text-lg font-bold text-orange-600">{stats.recent}</div>
                                <div className="text-xs text-gray-600">Recently Shown</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-lg font-bold text-green-600">{stats.fresh}</div>
                                <div className="text-xs text-gray-600">Fresh Words</div>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="text-lg font-bold text-purple-600">{stats.mastered}</div>
                                <div className="text-xs text-gray-600">Mastered</div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="text-lg font-bold text-gray-600">{stats.never}</div>
                                <div className="text-xs text-gray-600">Never Seen</div>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              resetMasteredWords();
                              window.location.reload();
                            }}
                            className="flex items-center gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Reset Mastered Words
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              resetAllWordHistory();
                              window.location.reload();
                            }}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Reset Word History
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="data-management">
                    <AccordionTrigger className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Data Management
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Export Progress</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Download your learning progress as a JSON file for backup or transfer
                        </p>
                        <Button onClick={exportProgress} className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Export Progress
                        </Button>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Import Progress</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Upload a previously exported progress file to restore your data
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept=".json"
                            onChange={importProgress}
                            className="text-sm"
                            id="import-file"
                          />
                          <label htmlFor="import-file" className="sr-only">
                            Import progress file
                          </label>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2 text-red-600">Reset Progress</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          This will permanently delete all your learning progress
                        </p>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Reset All Progress
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete all your progress data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleResetProgress}>
                                Yes, reset everything
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 