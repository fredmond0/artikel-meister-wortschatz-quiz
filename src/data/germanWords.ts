// German words with articles and English translations
// Starting with 50 common words for the MVP

export interface GermanWord {
  german: string;
  article: 'der' | 'die' | 'das';
  english: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export const germanWords: GermanWord[] = [
  { german: "Haus", article: "das", english: ["house", "home", "building"], difficulty: "easy" },
  { german: "Mann", article: "der", english: ["man", "husband"], difficulty: "easy" },
  { german: "Frau", article: "die", english: ["woman", "wife", "Mrs."], difficulty: "easy" },
  { german: "Kind", article: "das", english: ["child", "kid"], difficulty: "easy" },
  { german: "Auto", article: "das", english: ["car", "automobile"], difficulty: "easy" },
  { german: "Buch", article: "das", english: ["book"], difficulty: "easy" },
  { german: "Tisch", article: "der", english: ["table", "desk"], difficulty: "easy" },
  { german: "Stuhl", article: "der", english: ["chair"], difficulty: "easy" },
  { german: "Wasser", article: "das", english: ["water"], difficulty: "easy" },
  { german: "Brot", article: "das", english: ["bread"], difficulty: "easy" },
  
  { german: "Zeit", article: "die", english: ["time"], difficulty: "medium" },
  { german: "Jahr", article: "das", english: ["year"], difficulty: "medium" },
  { german: "Tag", article: "der", english: ["day"], difficulty: "medium" },
  { german: "Nacht", article: "die", english: ["night"], difficulty: "medium" },
  { german: "Stadt", article: "die", english: ["city", "town"], difficulty: "medium" },
  { german: "Land", article: "das", english: ["country", "land"], difficulty: "medium" },
  { german: "Welt", article: "die", english: ["world"], difficulty: "medium" },
  { german: "Leben", article: "das", english: ["life"], difficulty: "medium" },
  { german: "Arbeit", article: "die", english: ["work", "job"], difficulty: "medium" },
  { german: "Geld", article: "das", english: ["money"], difficulty: "medium" },
  
  { german: "Freund", article: "der", english: ["friend"], difficulty: "easy" },
  { german: "Familie", article: "die", english: ["family"], difficulty: "easy" },
  { german: "Schule", article: "die", english: ["school"], difficulty: "easy" },
  { german: "Lehrer", article: "der", english: ["teacher"], difficulty: "easy" },
  { german: "Student", article: "der", english: ["student"], difficulty: "easy" },
  { german: "Zimmer", article: "das", english: ["room"], difficulty: "easy" },
  { german: "Küche", article: "die", english: ["kitchen"], difficulty: "easy" },
  { german: "Bad", article: "das", english: ["bathroom"], difficulty: "easy" },
  { german: "Fenster", article: "das", english: ["window"], difficulty: "easy" },
  { german: "Tür", article: "die", english: ["door"], difficulty: "easy" },
  
  { german: "Problem", article: "das", english: ["problem"], difficulty: "medium" },
  { german: "Frage", article: "die", english: ["question"], difficulty: "medium" },
  { german: "Antwort", article: "die", english: ["answer"], difficulty: "medium" },
  { german: "Weg", article: "der", english: ["way", "path"], difficulty: "medium" },
  { german: "Grund", article: "der", english: ["reason", "ground"], difficulty: "medium" },
  { german: "Geschichte", article: "die", english: ["story", "history"], difficulty: "hard" },
  { german: "Möglichkeit", article: "die", english: ["possibility", "opportunity"], difficulty: "hard" },
  { german: "Gesellschaft", article: "die", english: ["society", "company"], difficulty: "hard" },
  { german: "Entwicklung", article: "die", english: ["development"], difficulty: "hard" },
  { german: "Beziehung", article: "die", english: ["relationship"], difficulty: "hard" },
  
  { german: "Musik", article: "die", english: ["music"], difficulty: "easy" },
  { german: "Film", article: "der", english: ["movie", "film"], difficulty: "easy" },
  { german: "Spiel", article: "das", english: ["game", "play"], difficulty: "easy" },
  { german: "Sport", article: "der", english: ["sport"], difficulty: "easy" },
  { german: "Telefon", article: "das", english: ["telephone", "phone"], difficulty: "easy" },
  { german: "Computer", article: "der", english: ["computer"], difficulty: "easy" },
  { german: "Internet", article: "das", english: ["internet"], difficulty: "medium" },
  { german: "Universität", article: "die", english: ["university"], difficulty: "medium" },
  { german: "Krankenhaus", article: "das", english: ["hospital"], difficulty: "medium" },
  { german: "Restaurant", article: "das", english: ["restaurant"], difficulty: "medium" },
  { german: "Hotel", article: "das", english: ["hotel"], difficulty: "medium" }
];

export const articles = ['der', 'die', 'das'] as const;