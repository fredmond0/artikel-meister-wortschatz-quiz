import { Header } from '@/components/Header';
import { MatchingGame } from '@/components/MatchingGame';

const MatchingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <MatchingGame />
      </main>
    </div>
  );
};

export default MatchingPage;