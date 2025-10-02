import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const GameSetup = () => {
  const navigate = useNavigate();
  const [numPlayers, setNumPlayers] = useState<number>(4);
  const [targetPoints, setTargetPoints] = useState<string>('101');
  const [amountPerPlayer, setAmountPerPlayer] = useState<string>('100');
  const [playerNames, setPlayerNames] = useState<string[]>(Array(4).fill(''));

  const handleNumPlayersChange = (value: string) => {
    const num = parseInt(value);
    setNumPlayers(num);
    setPlayerNames(Array(num).fill(''));
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated);
  };

  const handleSubmit = () => {
    if (!targetPoints || parseInt(targetPoints) <= 0) {
      toast({
        title: "Invalid Target",
        description: "Please enter a valid target points.",
        variant: "destructive"
      });
      return;
    }

    if (!amountPerPlayer || parseFloat(amountPerPlayer) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount per player.",
        variant: "destructive"
      });
      return;
    }

    const filledNames = playerNames.filter(name => name.trim() !== '');
    if (filledNames.length !== numPlayers) {
      toast({
        title: "Incomplete Names",
        description: "Please fill all player names.",
        variant: "destructive"
      });
      return;
    }

    const uniqueNames = new Set(filledNames);
    if (uniqueNames.size !== filledNames.length) {
      toast({
        title: "Duplicate Names",
        description: "All player names must be unique.",
        variant: "destructive"
      });
      return;
    }

    navigate('/shuffler-selection', {
      state: {
        numPlayers,
        targetPoints: parseInt(targetPoints),
        amountPerPlayer: parseFloat(amountPerPlayer),
        playerNames: filledNames
      }
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto pt-8 pb-24 animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent">
          Setup New Game
        </h1>

        <div className="space-y-6">
          <div>
            <Label htmlFor="numPlayers" className="text-base font-semibold mb-2 block">
              Number of Players
            </Label>
            <Select value={numPlayers.toString()} onValueChange={handleNumPlayersChange}>
              <SelectTrigger id="numPlayers" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 8 }, (_, i) => i + 2).map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} Players
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="targetPoints" className="text-base font-semibold mb-2 block">
              Target Points
            </Label>
            <Input
              id="targetPoints"
              type="number"
              value={targetPoints}
              onChange={(e) => setTargetPoints(e.target.value)}
              className="h-12 text-lg"
              placeholder="e.g., 101"
            />
          </div>

          <div>
            <Label htmlFor="amount" className="text-base font-semibold mb-2 block">
              Amount per Player (₹)
            </Label>
            <Input
              id="amount"
              type="number"
              value={amountPerPlayer}
              onChange={(e) => setAmountPerPlayer(e.target.value)}
              className="h-12 text-lg"
              placeholder="e.g., 100"
            />
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">
              Player Names
            </Label>
            <div className="space-y-3">
              {Array.from({ length: numPlayers }).map((_, index) => (
                <Input
                  key={index}
                  value={playerNames[index]}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  placeholder={`Player ${index + 1} name`}
                  className="h-11"
                />
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 mt-8"
          size="lg"
        >
          Continue to Shuffler Selection
        </Button>
      </div>
    </div>
  );
};

export default GameSetup;
