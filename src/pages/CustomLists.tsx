import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Brain, 
  Trash2, 
  Calendar, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  BookOpen,
  ListChecks,
  ArrowLeft,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  loadCustomLists, 
  saveCustomLists, 
  loadListSettings, 
  saveListSettings, 
  addCustomList, 
  removeCustomList,
  getActiveListsInfo,
  resetCustomLists,
  CustomWordList,
  ListSettings,
  CustomWord
} from '@/lib/progressUtils';
import { Header } from '@/components/Header';
import { germanWords } from '@/data/germanWords';

interface TopicVocabularyResponse {
  topic: string;
  words: CustomWord[];
  difficulty: string;
  count: number;
}

export function CustomLists() {
  const navigate = useNavigate();
  const [customLists, setCustomLists] = useState<CustomWordList[]>([]);
  const [listSettings, setListSettings] = useState<ListSettings>({
    activeListIds: [],
    includeDefault: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [topic, setTopic] = useState('');
  const [wordCount, setWordCount] = useState(25);
  
  // Preview state
  const [previewList, setPreviewList] = useState<CustomWordList | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCustomLists(loadCustomLists());
    setListSettings(loadListSettings());
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const generateTopicVocabulary = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/.netlify/functions/get-topic-vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          count: wordCount
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.details || errorData.error || 'Failed to generate vocabulary');
        } catch (parseError) {
          throw new Error(`Server error (${response.status}): ${errorText || 'Unknown error'}`);
        }
      }

      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!responseText) {
        throw new Error('Empty response from server');
      }

      const data: TopicVocabularyResponse = JSON.parse(responseText);
      console.log('Parsed data:', data);
      
      if (!data.words || !Array.isArray(data.words)) {
        throw new Error('Invalid response format: missing words array');
      }

      // Create preview list
      const previewListData: CustomWordList = {
        id: `preview-${Date.now()}`,
        name: data.topic,
        topic: data.topic,
        difficulty: data.difficulty || 'intermediate',
        words: data.words,
        createdAt: Date.now(),
        wordCount: data.count
      };

      setPreviewList(previewListData);
      setSuccess(`Generated ${data.count} words for "${data.topic}"`);
      
    } catch (error) {
      console.error('Error generating vocabulary:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate vocabulary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const savePreviewList = () => {
    if (!previewList) return;
    
    const savedList = addCustomList(previewList.topic, previewList.difficulty, previewList.words);
    setCustomLists([...customLists, savedList]);
    setPreviewList(null);
    setTopic('');
    setSuccess(`Saved "${savedList.name}" with ${savedList.wordCount} words`);
  };

  const deleteList = (listId: string) => {
    removeCustomList(listId);
    setCustomLists(customLists.filter(list => list.id !== listId));
    setSuccess('List deleted successfully');
  };

      const toggleListActive = (listId: string, isActive: boolean) => {
      const newSettings = { ...listSettings };
      
      if (isActive) {
        newSettings.activeListIds.push(listId);
      } else {
        newSettings.activeListIds = newSettings.activeListIds.filter(id => id !== listId);
      }
      
      saveListSettings(newSettings);
      setListSettings(newSettings);
    };

      const toggleDefaultList = (includeDefault: boolean) => {
      const newSettings = { ...listSettings, includeDefault };
      saveListSettings(newSettings);
      setListSettings(newSettings);
    };

  const resetAllLists = () => {
    resetCustomLists();
    setCustomLists([]);
          setListSettings({ activeListIds: [], includeDefault: true });
    setPreviewList(null);
    setSuccess('All custom lists reset successfully');
  };

  const { totalWords, activeListNames } = getActiveListsInfo(germanWords);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-full">
              <ListChecks className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Custom Word Lists</h1>
              <p className="text-gray-600">Create personalized vocabulary lists for any topic using AI</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/progress')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Progress
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

        {/* Status Messages */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="generate" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Manage Lists
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-4">
            <Card className="border-blue-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  Generate Topic Vocabulary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Topic
                      </label>
                      <Input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., Space, Cooking, Medicine..."
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Words
                      </label>
                      <Input
                        type="number"
                        value={wordCount}
                        onChange={(e) => setWordCount(Math.max(10, Math.min(100, parseInt(e.target.value) || 25)))}
                        min="10"
                        max="100"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={generateTopicVocabulary}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate Vocabulary
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview Generated List */}
            {previewList && (
              <Card className="border-green-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Preview: {previewList.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline">{previewList.difficulty}</Badge>
                      <Badge variant="outline">{previewList.wordCount} words</Badge>
                    </div>
                    <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {previewList.words.slice(0, 20).map((word, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="font-medium">
                              {word.article && `${word.article} `}{word.german}
                            </span>
                            <span className="text-gray-600">
                              ({word.english.join(', ')})
                            </span>
                          </div>
                        ))}
                        {previewList.words.length > 20 && (
                          <div className="col-span-full text-gray-500 text-center">
                            ... and {previewList.words.length - 20} more words
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={savePreviewList} className="flex-1 bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Save List
                    </Button>
                    <Button variant="outline" onClick={() => setPreviewList(null)}>
                      Discard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-gray-600" />
                  Select Word Lists for Quiz
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Choose which word lists to include in your German quiz. Selected lists will be combined.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Active Selection Summary */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Currently Active in Quiz
                  </h3>
                  <div className="text-sm space-y-1">
                    <p><strong>Total Words:</strong> {totalWords}</p>
                    <p><strong>Active Lists:</strong> {activeListNames.length > 0 ? activeListNames.join(', ') : 'None selected'}</p>
                  </div>
                </div>

                {/* Default List */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-700">Built-in Word List</h3>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={listSettings.includeDefault}
                        onCheckedChange={toggleDefaultList}
                      />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          Common German Words
                          {listSettings.includeDefault && (
                            <Badge variant="default" className="text-xs bg-blue-600">Active</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Core vocabulary for German language learning
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{germanWords.length} words</Badge>
                  </div>
                </div>

                {/* Custom Lists */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-700">Your Custom Lists</h3>
                  {customLists.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No custom lists created yet.</p>
                      <p className="text-sm">Use the Generate tab to create topic-specific vocabulary!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customLists.map((list) => (
                        <div key={list.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={listSettings.activeListIds.includes(list.id)}
                              onCheckedChange={(checked) => toggleListActive(list.id, checked as boolean)}
                            />
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {list.name}
                                {listSettings.activeListIds.includes(list.id) && (
                                  <Badge variant="default" className="text-xs bg-green-600">Active</Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{list.difficulty}</Badge>
                                <span>{list.wordCount} words</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(list.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteList(list.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reset Button */}
                {customLists.length > 0 && (
                  <div className="pt-4 border-t">
                    <Button 
                      variant="destructive" 
                      onClick={resetAllLists}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All Custom Lists
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      This will permanently delete all your custom lists.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
} 