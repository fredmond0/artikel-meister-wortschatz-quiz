import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { germanWords, type GermanWord } from '@/data/germanWords';
import { Trophy, Target, BarChart3, Settings, Trash2, Download, Upload, BookOpen, Flame, ArrowLeft, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { 
  type WordProgress, 
  type ProgressSettings, 
  type CustomWord,
  loadProgress, 
  loadSettings, 
  saveSettings, 
  updateMasteredWords, 
  resetAllProgress,
  getConsolidatedWords,
  getActiveListsInfo,
  STORAGE_KEY,
  SETTINGS_KEY
} from '@/lib/progressUtils';

export function Progress() {
  const navigate = useNavigate();
  const [wordProgress, setWordProgress] = useState<WordProgress>({});
  const [settings, setSettings] = useState<ProgressSettings>({ masteryThreshold: 3 });
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());
  const [consolidatedWords, setConsolidatedWords] = useState<CustomWord[]>([]);
  const [activeListsInfo, setActiveListsInfo] = useState<{totalWords: number; activeListNames: string[]}>(
    { totalWords: 0, activeListNames: [] }
  );

  // Load progress and settings
  useEffect(() => {
    const savedProgress = loadProgress();
    const savedSettings = loadSettings();
    setWordProgress(savedProgress);
    setSettings(savedSettings);
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
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/custom-lists')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ListChecks className="h-4 w-4" />
              Custom Lists
            </Button>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Quiz
            </Button>
          </div>
        </div>

        {/* Active Lists Info */}
        {activeListsInfo.activeListNames.length > 0 && (
          <Card className="border-blue-300 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Active Word Lists</CardTitle>
              </div>
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

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-yellow-300 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-lg">Mastered</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{masteredCount}</div>
              <p className="text-sm text-gray-600">of {totalWords} words</p>
              <ProgressBar value={completionPercentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-blue-300 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">In Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{wordsInProgress}</div>
              <p className="text-sm text-gray-600">words learning</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-lg">Not Started</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{wordsNotStarted}</div>
              <p className="text-sm text-gray-600">words remaining</p>
            </CardContent>
          </Card>

          <Card className="border-orange-300 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{completionPercentage}%</div>
              <p className="text-sm text-gray-600">complete</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Learning Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Overall Progress</span>
                      <span>{completionPercentage}%</span>
                    </div>
                    <ProgressBar value={completionPercentage} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600">{streakInfo.daysStudied}</div>
                      <div className="text-sm text-gray-600">Days Studied</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                          <div className="text-2xl font-bold text-blue-600">{streakInfo.totalQuestions}</div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                    </div>
                  </div>

                  {masteredCount > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">🎉 Recent Achievements</h4>
                      <p className="text-sm text-green-700">
                        You've mastered {masteredCount} words! Keep up the great work!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Learning Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Current Settings</h4>
                  <div className="text-sm text-gray-600">
                    <p>• Mastery requires {settings.masteryThreshold} correct answers</p>
                    <p>• {masteredCount} words currently mastered</p>
                    <p>• {wordsInProgress} words in progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Learning Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Overall Progress</span>
                      <span>{completionPercentage}%</span>
                    </div>
                    <ProgressBar value={completionPercentage} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600">{masteredCount}</div>
                      <div className="text-sm text-gray-600">Mastered Words</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{wordsInProgress}</div>
                      <div className="text-sm text-gray-600">In Progress</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-600">{wordsNotStarted}</div>
                      <div className="text-sm text-gray-600">Not Started</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 