import { Brain, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="bg-gradient-primary text-primary-foreground py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Brain className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Deutsch Artikel</h1>
            <BookOpen className="h-8 w-8" />
          </div>
          <p className="text-primary-foreground/90 text-sm">
            Master German articles with 1000 common words
          </p>
        </div>
        
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            Article Quiz
          </Button>
        </div>
      </div>
    </header>
  );
}