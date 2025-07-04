export interface WordProgress {
  [german: string]: {
    correctCount: number;
    totalSeen: number;
    lastSeen: number;
  };
}

export interface ProgressSettings {
  masteryThreshold: number;
}

export interface CustomWord {
  german: string;
  article: 'der' | 'die' | 'das' | '';
  type: string;
  english: string[];
}

export interface CustomWordList {
  id: string;
  name: string;
  topic: string;
  difficulty: string;
  words: CustomWord[];
  createdAt: number;
  wordCount: number;
}

export interface ListSettings {
  activeListIds: string[];
  includeDefault: boolean;
}

export const STORAGE_KEY = 'artikel-meister-progress';
export const SETTINGS_KEY = 'artikel-meister-settings';
export const CUSTOM_LISTS_KEY = 'artikel-meister-custom-lists';
export const LIST_SETTINGS_KEY = 'artikel-meister-list-settings';

export const loadProgress = (): WordProgress => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Failed to load progress:', error);
    return {};
  }
};

export const saveProgress = (progress: WordProgress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
};

export const loadSettings = (): ProgressSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : { masteryThreshold: 3 };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return { masteryThreshold: 3 };
  }
};

export const saveSettings = (settings: ProgressSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

export const loadCustomLists = (): CustomWordList[] => {
  try {
    const saved = localStorage.getItem(CUSTOM_LISTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load custom lists:', error);
    return [];
  }
};

export const saveCustomLists = (lists: CustomWordList[]) => {
  try {
    localStorage.setItem(CUSTOM_LISTS_KEY, JSON.stringify(lists));
  } catch (error) {
    console.error('Failed to save custom lists:', error);
  }
};

export const loadListSettings = (): ListSettings => {
  try {
    const saved = localStorage.getItem(LIST_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : { activeListIds: [], includeDefault: true };
  } catch (error) {
    console.error('Failed to load list settings:', error);
    return { activeListIds: [], includeDefault: true };
  }
};

export const saveListSettings = (settings: ListSettings) => {
  try {
    localStorage.setItem(LIST_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save list settings:', error);
  }
};

export const addCustomList = (topic: string, difficulty: string, words: CustomWord[]): CustomWordList => {
  const lists = loadCustomLists();
  const newList: CustomWordList = {
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: topic,
    topic,
    difficulty,
    words,
    createdAt: Date.now(),
    wordCount: words.length
  };
  
  lists.push(newList);
  saveCustomLists(lists);
  return newList;
};

export const removeCustomList = (listId: string) => {
  const lists = loadCustomLists();
  const filteredLists = lists.filter(list => list.id !== listId);
  saveCustomLists(filteredLists);
  
  // Remove from active lists if it was active
  const listSettings = loadListSettings();
  listSettings.activeListIds = listSettings.activeListIds.filter(id => id !== listId);
  saveListSettings(listSettings);
};

export const getConsolidatedWords = (defaultWords: CustomWord[]): CustomWord[] => {
  const customLists = loadCustomLists();
  const listSettings = loadListSettings();
  
  let allWords: CustomWord[] = [];
  
  // Add default words if included
  if (listSettings.includeDefault) {
    allWords.push(...defaultWords);
  }
  
  // Add words from active custom lists
  listSettings.activeListIds.forEach(listId => {
    const list = customLists.find(l => l.id === listId);
    if (list) {
      allWords.push(...list.words);
    }
  });
  
  // Remove duplicates based on German word (case-insensitive)
  const uniqueWords = allWords.filter((word, index, self) => 
    index === self.findIndex(w => 
      w.german.toLowerCase() === word.german.toLowerCase()
    )
  );
  
  return uniqueWords;
};

export const getActiveListsInfo = (defaultWords: CustomWord[]): { totalWords: number; activeListNames: string[] } => {
  const customLists = loadCustomLists();
  const listSettings = loadListSettings();
  
  let totalWords = 0;
  const activeListNames: string[] = [];
  
  if (listSettings.includeDefault) {
    // Calculate actual deduplicated count of default words
    const consolidatedWords = getConsolidatedWords(defaultWords);
    const defaultWordsCount = consolidatedWords.filter(word => 
      defaultWords.some(dw => dw.german.toLowerCase() === word.german.toLowerCase())
    ).length;
    
    activeListNames.push(`${defaultWordsCount} Common Words`);
    totalWords += defaultWordsCount;
  }
  
  listSettings.activeListIds.forEach(listId => {
    const list = customLists.find(l => l.id === listId);
    if (list) {
      activeListNames.push(list.name);
      totalWords += list.wordCount;
    }
  });
  
  return { totalWords, activeListNames };
};

export const updateMasteredWords = (progress: WordProgress, threshold: number): Set<string> => {
  const mastered = new Set<string>();
  Object.entries(progress).forEach(([word, data]) => {
    if (data.correctCount >= threshold) {
      mastered.add(word);
    }
  });
  return mastered;
};

export const resetAllProgress = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
};

export const resetCustomLists = () => {
  localStorage.removeItem(CUSTOM_LISTS_KEY);
  localStorage.removeItem(LIST_SETTINGS_KEY);
};

export const updateWordProgress = (
  currentProgress: WordProgress,
  germanWord: string,
  isCorrect: boolean
): WordProgress => {
  const newProgress = { ...currentProgress };
  const wordKey = germanWord;
  
  if (!newProgress[wordKey]) {
    newProgress[wordKey] = { correctCount: 0, totalSeen: 0, lastSeen: Date.now() };
  }
  
  newProgress[wordKey].totalSeen += 1;
  newProgress[wordKey].lastSeen = Date.now();
  
  if (isCorrect) {
    newProgress[wordKey].correctCount += 1;
  }
  
  return newProgress;
}; 