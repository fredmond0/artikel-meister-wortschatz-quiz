import { Brain, BookOpen } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-gradient-primary text-primary-foreground py-6 px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Brain className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Deutsch Artikel</h1>
          <BookOpen className="h-8 w-8" />
        </div>
        <p className="text-primary-foreground/90 text-sm">
          Master German articles with 1000 common words
        </p>
      </div>
    </header>
  );
}