import { Brain, BookOpen, Globe } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-gradient-primary text-primary-foreground py-4 px-4 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="p-1.5 bg-white/10 rounded-full">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wide">Artikel Meister</h1>
              <div className="flex items-center justify-center gap-2">
                <Globe className="h-3 w-3" />
                <span className="text-xs font-medium">Deutsch Wortschatz Quiz</span>
              </div>
            </div>
            <div className="p-1.5 bg-white/10 rounded-full">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}