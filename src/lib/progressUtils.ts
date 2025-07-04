export interface WordProgress {
  [german: string]: {
    correctCount: number;
    totalSeen: number;
    lastSeen: number;
    articleCorrect: number;
    articleAttempts: number;
    translationCorrect: number;
    translationAttempts: number;
  };
}

export interface ProgressSettings {
  masteryThreshold: number;
  repetitionPreference: number; // 0-100, where 0 = max variety, 100 = max repetition
  masteredWordsEnabled: boolean;
  masteredWordsResetDays: number; // days after which mastered words can reappear
}

export interface GameStats {
  totalQuestions: number;
  correctAnswers: number;
  currentStreak: number;
  bestStreak: number;
  articlesCorrect: number;
  articlesAttempted: number;
  translationsCorrect: number;
  translationsAttempted: number;
  startDate: number;
  lastPlayed: number;
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

export interface WordHistory {
  lastShown: number;
  timesShown: number;
  recentlyIncorrect: boolean;
  lastIncorrectTime: number;
  consecutiveCorrect: number;
  isMastered: boolean;
}

export interface SmartSettings {
  repetitionPreference: number;
  masteredWordsEnabled: boolean;
  masteredWordsResetDays: number;
}

export const STORAGE_KEY = 'artikel-meister-progress';
export const SETTINGS_KEY = 'artikel-meister-settings';
export const CUSTOM_LISTS_KEY = 'artikel-meister-custom-lists';
export const LIST_SETTINGS_KEY = 'artikel-meister-list-settings';
export const GAME_STATS_KEY = 'artikel-meister-game-stats';
export const WORD_HISTORY_KEY = 'artikel-meister-word-history';

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
    return saved ? JSON.parse(saved) : { 
      masteryThreshold: 3,
      repetitionPreference: 50,
      masteredWordsEnabled: false,
      masteredWordsResetDays: 7
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return { 
      masteryThreshold: 3,
      repetitionPreference: 50,
      masteredWordsEnabled: false,
      masteredWordsResetDays: 7
    };
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
  localStorage.removeItem(WORD_HISTORY_KEY);
};

export const resetCustomLists = () => {
  localStorage.removeItem(CUSTOM_LISTS_KEY);
  localStorage.removeItem(LIST_SETTINGS_KEY);
};

export const updateWordProgress = (
  currentProgress: WordProgress,
  germanWord: string,
  isCorrect: boolean,
  articleCorrect?: boolean,
  translationCorrect?: boolean
): WordProgress => {
  const newProgress = { ...currentProgress };
  const wordKey = germanWord;
  
  if (!newProgress[wordKey]) {
    newProgress[wordKey] = { 
      correctCount: 0, 
      totalSeen: 0, 
      lastSeen: Date.now(),
      articleCorrect: 0,
      articleAttempts: 0,
      translationCorrect: 0,
      translationAttempts: 0
    };
  }
  
  newProgress[wordKey].totalSeen += 1;
  newProgress[wordKey].lastSeen = Date.now();
  
  if (isCorrect) {
    newProgress[wordKey].correctCount += 1;
  }
  
  // Track article accuracy if provided
  if (articleCorrect !== undefined) {
    newProgress[wordKey].articleAttempts += 1;
    if (articleCorrect) {
      newProgress[wordKey].articleCorrect += 1;
    }
  }
  
  // Track translation accuracy if provided
  if (translationCorrect !== undefined) {
    newProgress[wordKey].translationAttempts += 1;
    if (translationCorrect) {
      newProgress[wordKey].translationCorrect += 1;
    }
  }
  
  return newProgress;
};

export const loadGameStats = (): GameStats => {
  try {
    const saved = localStorage.getItem(GAME_STATS_KEY);
    return saved ? JSON.parse(saved) : {
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
    };
  } catch (error) {
    console.error('Failed to load game stats:', error);
    return {
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
    };
  }
};

export const saveGameStats = (stats: GameStats) => {
  try {
    localStorage.setItem(GAME_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save game stats:', error);
  }
};

export const updateGameStats = (
  isCorrect: boolean,
  currentStreak: number,
  articleCorrect?: boolean,
  translationCorrect?: boolean
): GameStats => {
  const stats = loadGameStats();
  
  // Update basic stats
  stats.totalQuestions += 1;
  stats.lastPlayed = Date.now();
  
  if (isCorrect) {
    stats.correctAnswers += 1;
  }
  
  // Update streak
  stats.currentStreak = currentStreak;
  if (currentStreak > stats.bestStreak) {
    stats.bestStreak = currentStreak;
  }
  
  // Update article stats
  if (articleCorrect !== undefined) {
    stats.articlesAttempted += 1;
    if (articleCorrect) {
      stats.articlesCorrect += 1;
    }
  }
  
  // Update translation stats
  if (translationCorrect !== undefined) {
    stats.translationsAttempted += 1;
    if (translationCorrect) {
      stats.translationsCorrect += 1;
    }
  }
  
  saveGameStats(stats);
  return stats;
};

export const loadWordHistory = (): { [german: string]: WordHistory } => {
  try {
    const saved = localStorage.getItem(WORD_HISTORY_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Failed to load word history:', error);
    return {};
  }
};

export const saveWordHistory = (history: { [german: string]: WordHistory }) => {
  try {
    localStorage.setItem(WORD_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save word history:', error);
  }
};

export const updateWordHistory = (
  germanWord: string,
  isCorrect: boolean,
  masteryThreshold: number
): WordHistory => {
  const history = loadWordHistory();
  const now = Date.now();
  
  if (!history[germanWord]) {
    history[germanWord] = {
      lastShown: now,
      timesShown: 0,
      recentlyIncorrect: false,
      lastIncorrectTime: 0,
      consecutiveCorrect: 0,
      isMastered: false
    };
  }
  
  const wordHistory = history[germanWord];
  wordHistory.lastShown = now;
  wordHistory.timesShown += 1;
  
  if (isCorrect) {
    wordHistory.consecutiveCorrect += 1;
    wordHistory.recentlyIncorrect = false;
    
    // Check if word is now mastered
    if (wordHistory.consecutiveCorrect >= masteryThreshold) {
      wordHistory.isMastered = true;
    }
  } else {
    wordHistory.consecutiveCorrect = 0;
    wordHistory.recentlyIncorrect = true;
    wordHistory.lastIncorrectTime = now;
    wordHistory.isMastered = false;
  }
  
  saveWordHistory(history);
  return wordHistory;
};

export const selectSmartWord = (
  availableWords: CustomWord[],
  settings: ProgressSettings
): CustomWord | null => {
  if (availableWords.length === 0) return null;
  
  const history = loadWordHistory();
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneHour = 60 * 60 * 1000;
  
  // Categorize words into pools
  const incorrectPool: CustomWord[] = [];
  const recentPool: CustomWord[] = [];
  const freshPool: CustomWord[] = [];
  const neverSeenPool: CustomWord[] = [];
  const masteredPool: CustomWord[] = [];
  
  availableWords.forEach(word => {
    const wordHistory = history[word.german];
    
    if (!wordHistory) {
      // Never seen word
      neverSeenPool.push(word);
      return;
    }
    
    // Check if mastered word should be included
    if (wordHistory.isMastered) {
      const daysSinceLastSeen = (now - wordHistory.lastShown) / oneDay;
      if (settings.masteredWordsEnabled && daysSinceLastSeen >= settings.masteredWordsResetDays) {
        masteredPool.push(word);
      }
      return;
    }
    
    // Recently incorrect words (within last 24 hours)
    if (wordHistory.recentlyIncorrect && (now - wordHistory.lastIncorrectTime) < oneDay) {
      incorrectPool.push(word);
      return;
    }
    
    // Recent words (shown within last hour)
    if ((now - wordHistory.lastShown) < oneHour) {
      recentPool.push(word);
      return;
    }
    
    // Fresh words (not seen recently but have history)
    freshPool.push(word);
  });
  
 // Calculate pool weights based on repetition preference (more dramatic differences)
const preference = settings.repetitionPreference / 100;

// Use a power curve (e.g., squared) to make the slider's effect more dramatic.
// This means the middle of the slider is more balanced, and the extremes are very strong.
const repetitionFactor = Math.pow(preference, 2);
const varietyFactor = Math.pow(1 - preference, 0.5); // Use a gentler curve for variety

const weights = {
  // At max repetition, this weight becomes extremely high.
  incorrect: 0.15 + repetitionFactor * 5,
  // This pool only gets significant weight at high repetition settings.
  recent: repetitionFactor * 2,
  // This is the default pool, strong when the slider is in the middle or on the variety side.
  fresh: 0.4 * varietyFactor,
  // This is the main pool for variety, very strong when the slider is on the left.
  neverSeen: 0.6 * varietyFactor,
  // Mastered words only get a chance at high repetition, and even then it's small.
  mastered: repetitionFactor * 0.5
};
  
  // Build weighted pool
  const weightedPool: { word: CustomWord; weight: number }[] = [];
  
  incorrectPool.forEach(word => weightedPool.push({ word, weight: weights.incorrect }));
  recentPool.forEach(word => weightedPool.push({ word, weight: weights.recent }));
  freshPool.forEach(word => weightedPool.push({ word, weight: weights.fresh }));
  neverSeenPool.forEach(word => weightedPool.push({ word, weight: weights.neverSeen }));
  masteredPool.forEach(word => weightedPool.push({ word, weight: weights.mastered }));
  
  // Fallback strategies
  if (weightedPool.length === 0) {
    // No eligible words, return random from available
    return availableWords[Math.floor(Math.random() * availableWords.length)];
  }
  
  // Calculate total weight
  const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
  
  if (totalWeight === 0) {
    // All weights are 0, return random
    return weightedPool[Math.floor(Math.random() * weightedPool.length)].word;
  }
  
  // Weighted random selection
  let random = Math.random() * totalWeight;
  for (const item of weightedPool) {
    random -= item.weight;
    if (random <= 0) {
      return item.word;
    }
  }
  
  // Fallback to last item
  return weightedPool[weightedPool.length - 1].word;
};

export const getWordSelectionStats = (availableWords: CustomWord[]): {
  incorrect: number;
  recent: number;
  fresh: number;
  mastered: number;
  never: number;
} => {
  const history = loadWordHistory();
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneHour = 60 * 60 * 1000;
  
  const stats = {
    incorrect: 0,
    recent: 0,
    fresh: 0,
    mastered: 0,
    never: 0
  };
  
  availableWords.forEach(word => {
    const wordHistory = history[word.german];
    
    if (!wordHistory) {
      // Track never seen separately for display
      stats.never++;
      return;
    }
    
    if (wordHistory.isMastered) {
      stats.mastered++;
      return;
    }
    
    if (wordHistory.recentlyIncorrect && (now - wordHistory.lastIncorrectTime) < oneDay) {
      stats.incorrect++;
      return;
    }
    
    if ((now - wordHistory.lastShown) < oneHour) {
      stats.recent++;
      return;
    }
    
    // Words not seen recently (but have history)
    stats.fresh++;
  });
  
  return stats;
};

export const resetMasteredWords = () => {
  const history = loadWordHistory();
  Object.keys(history).forEach(word => {
    history[word].isMastered = false;
    history[word].consecutiveCorrect = 0;
  });
  saveWordHistory(history);
};

export const resetAllWordHistory = () => {
  localStorage.removeItem(WORD_HISTORY_KEY);
}; 