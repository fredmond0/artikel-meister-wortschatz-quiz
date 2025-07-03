import { Header } from '@/components/Header';
import { GameCard } from '@/components/GameCard';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <GameCard />
      </main>
    </div>
  );
};

export default Index;
