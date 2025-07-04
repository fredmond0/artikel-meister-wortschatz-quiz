import { BookOpen, BarChart3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Quiz', icon: BookOpen },
    { path: '/progress', label: 'Progress', icon: BarChart3 },
    { path: '/custom-lists', label: 'Custom Lists', icon: List }
  ];

  const currentPath = location.pathname;

  return (
    <header className="bg-gradient-primary text-primary-foreground py-4 px-4 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/10 rounded-full">
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wide">artikelmeister</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs font-small">allmydogseat</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "secondary" : "ghost"}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 ${
                    isActive 
                      ? "bg-white/20 text-white" 
                      : "text-primary-foreground hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}