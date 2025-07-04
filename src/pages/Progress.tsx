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
    setGameStats({
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
  };

  const handleResetWordHistory = () => {
    resetAllWordHistory();
    setWordProgress({});
    setMasteredWords(new Set());
    setGameStats({
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
  };

  const handleResetMasteredWords = () => {
    const newProgress = resetMasteredWords(wordProgress, settings.masteryThreshold);
    setWordProgress(newProgress);
    setMasteredWords(updateMasteredWords(newProgress, settings.masteryThreshold));
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
  const completionPercentage = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

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
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                              {wordsByCategory.mastered.map(({ word }) => (
                                <div key={word.german} className="flex gap-2">
                                  <span className="font-medium">{word.article} {word.german}</span>
                                  <span className="text-gray-500">({word.english.join(', ')})</span>
                                </div>
                              ))}
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Close</AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-xl font-bold text-blue-600">{wordsInProgress}</div>
                      <div className="text-xs text-gray-600">In Progress</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xl font-bold text-gray-600">{wordsNotStarted}</div>
                      <div className="text-xs text-gray-600">Not Started</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Statistics */}
            <Card className="border-green-300 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-green-600" />
                  Game Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Total Questions</div>
                  <div className="text-xl font-bold">{gameStats.totalQuestions}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Correct Answers</div>
                  <div className="text-xl font-bold">{gameStats.correctAnswers}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Current Streak</div>
                  <div className="text-xl font-bold">{gameStats.currentStreak}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Best Streak</div>
                  <div className="text-xl font-bold">{gameStats.bestStreak}</div>
                </div>
              </CardContent>
            </Card>

            {/* Word Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-gray-600" />
                  Word Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="in-progress">
                    <AccordionTrigger>In Progress ({wordsInProgress})</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {wordsByCategory.inProgress.map(({ word, progress }) => (
                          <div key={word.german} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md">
                            <span>{word.article} {word.german}</span>
                            <Badge variant="outline">Seen: {progress.totalSeen}, Correct: {progress.correctCount}</Badge>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="not-started">
                    <AccordionTrigger>Not Started ({wordsNotStarted})</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {wordsByCategory.notStarted.slice(0, 20).map(word => (
                          <div key={word.german} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md">
                            <span>{word.article} {word.german}</span>
                          </div>
                        ))}
                        {wordsByCategory.notStarted.length > 20 && <p className="text-center text-sm text-gray-500">...and {wordsByCategory.notStarted.length - 20} more</p>}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  Learning Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <label htmlFor="masteryThreshold" className="text-sm font-medium">
                    Mastery Threshold
                    <p className="text-xs text-gray-500">Correct answers needed to master a word.</p>
                  </label>
                  <Select
                    value={String(settings.masteryThreshold)}
                    onValueChange={(value) => handleSettingsChange({ ...settings, masteryThreshold: Number(value) })}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 7, 10].map(val => <SelectItem key={val} value={String(val)}>{val}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label htmlFor="repetitionPreference" className="text-sm font-medium">
                    Repetition Preference: {settings.repetitionPreference}%
                     <p className="text-xs text-gray-500">Balance between repeating difficult words and showing new ones.</p>
                  </label>
                  <Slider
                    id="repetitionPreference"
                    value={[settings.repetitionPreference]}
                    onValueChange={(value) => handleSettingsChange({ ...settings, repetitionPreference: value[0] })}
                    max={100}
                    step={10}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>More Variety</span>
                    <span>More Repetition</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="masteredWordsEnabled" className="text-sm font-medium">
                    Re-introduce Mastered Words
                    <p className="text-xs text-gray-500">Periodically re-test words you've already mastered.</p>
                  </label>
                  <Switch
                    id="masteredWordsEnabled"
                    checked={settings.masteredWordsEnabled}
                    onCheckedChange={(checked) => handleSettingsChange({ ...settings, masteredWordsEnabled: checked })}
                  />
                </div>

                {settings.masteredWordsEnabled && (
                  <div className="flex items-center justify-between">
                    <label htmlFor="masteredWordsResetDays" className="text-sm font-medium">
                      Re-introduction Frequency (Days)
                       <p className="text-xs text-gray-500">How often mastered words should reappear.</p>
                    </label>
                    <Select
                      value={String(settings.masteredWordsResetDays)}
                      onValueChange={(value) => handleSettingsChange({ ...settings, masteredWordsResetDays: Number(value) })}
                    >
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[7, 14, 30, 60, 90].map(val => <SelectItem key={val} value={String(val)}>{val}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shuffle className="h-5 w-5 text-gray-600" />
                  Word Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    The quiz prioritizes words you get wrong, then new words. See what's in the active pool.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <div className="font-bold text-red-600">{getWordSelectionStats(consolidatedWords).incorrect}</div>
                      <div className="text-xs">Incorrect</div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <div className="font-bold text-blue-600">{getWordSelectionStats(consolidatedWords).fresh}</div>
                      <div className="text-xs">New</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <div className="font-bold text-green-600">{getWordSelectionStats(consolidatedWords).mastered}</div>
                      <div className="text-xs">Mastered</div>
                    </div>
                  </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportProgress} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Progress
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <label htmlFor="import-file" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Progress
                      <input type="file" id="import-file" accept=".json" onChange={importProgress} className="hidden" />
                    </label>
                  </Button>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-red-600 hover:text-red-800">
                      Danger Zone: Reset Progress
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-4">
                        <div>
                          <h4 className="font-semibold">Reset Options</h4>
                          <p className="text-xs text-gray-600">Use these buttons to manage your learning data. These actions cannot be undone.</p>
                        </div>
                        <div className="space-y-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Reset Mastered Word List
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will reset the progress for all your mastered words, moving them back to 'In Progress'. Your statistics will be preserved. This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleResetMasteredWords}>
                                    Yes, Reset Mastered Words
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Reset Word History
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete all your word learning history and statistics. Your custom lists will not be affected. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleResetWordHistory}>
                                    Yes, Delete History
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full bg-red-800 hover:bg-red-900">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Reset All Progress
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will delete all your custom lists and reset all word progress and settings to default. This action is irreversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleResetProgress}>
                                    Yes, Delete Everything
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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