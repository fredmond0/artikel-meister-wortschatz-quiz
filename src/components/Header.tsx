import { Brain, BookOpen, Globe } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-gradient-primary text-primary-foreground py-8 px-4 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="p-2 bg-white/10 rounded-full">
              <Brain className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-wide">Artikel Meister</h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">Deutsch Wortschatz Quiz</span>
              </div>
            </div>
            <div className="p-2 bg-white/10 rounded-full">
              <BookOpen className="h-8 w-8" />
            </div>
          </div>
          <p className="text-primary-foreground/90 text-base leading-relaxed">
            Master German articles with 1000 most common words
          </p>
          <div className="mt-4 flex justify-center gap-1">
            <div className="w-8 h-1 bg-german-black/30 rounded"></div>
            <div className="w-8 h-1 bg-german-red/50 rounded"></div>
            <div className="w-8 h-1 bg-german-gold/70 rounded"></div>
          </div>
        </div>
      </div>
    </header>
  );
}