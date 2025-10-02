import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loadGameState } from '@/lib/gameLogic';
import { toast } from '@/hooks/use-toast';

const Home = () => {
  const [gameId, setGameId] = useState('');
  const navigate = useNavigate();

  const handleJoinGame = () => {
    if (gameId.length !== 4 || !/^\d{4}$/.test(gameId)) {
      toast({
        title: "Invalid Game ID",
        description: "Please enter a 4-digit game code.",
        variant: "destructive"
      });
      return;
    }

    const game = loadGameState(gameId);
    if (!game) {
      toast({
        title: "Game Not Found",
        description: "No game exists with this ID.",
        variant: "destructive"
      });
      return;
    }

    navigate(`/game/${gameId}`, { state: { spectatorMode: true } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
            Rummy Score
          </h1>
          <p className="text-muted-foreground text-lg">Manage your game like a pro</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => navigate('/setup')}
            className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90"
            size="lg"
          >
            Create New Game
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Enter 4-digit Game ID"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.slice(0, 4))}
              maxLength={4}
              className="h-12 text-center text-lg tracking-widest"
            />
            <Button
              onClick={handleJoinGame}
              variant="outline"
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              View Scoreboard
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground pt-8">
          <p>Track scores • Manage pool • Share with friends</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
