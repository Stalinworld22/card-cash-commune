import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { generateGameId, saveGameState, calculateShares } from '@/lib/gameLogic';
import { GameState, Player } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const ShufflerSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { numPlayers, targetPoints, amountPerPlayer, playerNames } = location.state || {};
  
  const [selectedShufflerId, setSelectedShufflerId] = useState<string>('');

  if (!playerNames) {
    navigate('/setup');
    return null;
  }

  const players: Player[] = playerNames.map((name: string, index: number) => ({
    id: `player_${Date.now()}_${index}`,
    name,
    totalScore: 0,
    status: 'active' as const,
    currentShare: 0
  }));

  const handleStartGame = () => {
    if (!selectedShufflerId) {
      toast({
        title: "Select Shuffler",
        description: "Please select who will shuffle first.",
        variant: "destructive"
      });
      return;
    }

    const gameId = generateGameId();
    const playersWithShares = calculateShares(players);

    const gameState: GameState = {
      gameId,
      targetPoints,
      amountPerPlayer,
      players: playersWithShares,
      rounds: [],
      totalPool: numPlayers * amountPerPlayer,
      createdAt: Date.now(),
      isFinished: false
    };

    saveGameState(gameState);

    toast({
      title: "Game Created!",
      description: `Game ID: ${gameId}`,
    });

    navigate(`/game/${gameId}`, { state: { firstShufflerId: selectedShufflerId } });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto pt-8 pb-24 animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
          Who Shuffles First?
        </h1>
        <p className="text-muted-foreground mb-8">
          Select the player who will shuffle for Round 1
        </p>

        <RadioGroup value={selectedShufflerId} onValueChange={setSelectedShufflerId}>
          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center space-x-3 p-4 bg-gradient-card rounded-xl shadow-card hover:shadow-elevated transition-shadow"
              >
                <RadioGroupItem value={player.id} id={player.id} />
                <Label
                  htmlFor={player.id}
                  className="flex-1 text-lg font-semibold cursor-pointer"
                >
                  {player.name}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>

        <Button
          onClick={handleStartGame}
          disabled={!selectedShufflerId}
          className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 mt-8"
          size="lg"
        >
          Start Game
        </Button>
      </div>
    </div>
  );
};

export default ShufflerSelection;
