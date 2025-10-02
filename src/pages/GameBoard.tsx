import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PlayerCard from '@/components/PlayerCard';
import ConfettiOverlay from '@/components/ConfettiOverlay';
import MoneyShowerOverlay from '@/components/MoneyShowerOverlay';
import { loadGameState, saveGameState, updatePlayerScores, getNextShuffler, addPlayerToGame, withdrawPlayer, rejoinPlayer, getRoundWinner, calculateShares } from '@/lib/gameLogic';
import { GameState } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Undo, Trophy } from 'lucide-react';

const GameBoard = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const firstShufflerId = location.state?.firstShufflerId;
  const spectatorMode = location.state?.spectatorMode || false;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentShufflerId, setCurrentShufflerId] = useState<string>('');
  
  const [showAddRound, setShowAddRound] = useState(false);
  const [roundScores, setRoundScores] = useState<Record<string, string>>({});
  
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawPlayerId, setWithdrawPlayerId] = useState('');
  
  const [showRejoinDialog, setShowRejoinDialog] = useState(false);
  const [rejoinPlayerId, setRejoinPlayerId] = useState('');
  const [rejoinShufflerPosition, setRejoinShufflerPosition] = useState<number>(0);
  
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
  const [roundWinnerNames, setRoundWinnerNames] = useState<string[]>([]);
  
  const [showFinalOverlay, setShowFinalOverlay] = useState(false);

  useEffect(() => {
    if (!gameId) {
      navigate('/');
      return;
    }

    const game = loadGameState(gameId);
    if (!game) {
      toast({
        title: "Game Not Found",
        description: "This game does not exist.",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    setGameState(game);
    
    if (game.rounds.length === 0 && firstShufflerId) {
      setCurrentShufflerId(firstShufflerId);
    } else if (game.rounds.length > 0) {
      const lastRound = game.rounds[game.rounds.length - 1];
      const nextShuffler = getNextShuffler(game.players, lastRound.shufflerId);
      setCurrentShufflerId(nextShuffler);
    }

    if (game.isFinished) {
      setShowFinalOverlay(true);
    }
  }, [gameId, navigate, firstShufflerId]);

  const handleOpenAddRound = () => {
    if (!gameState) return;
    const activePlayers = gameState.players.filter(p => p.status === 'active');
    const initialScores: Record<string, string> = {};
    activePlayers.forEach(p => initialScores[p.id] = '');
    setRoundScores(initialScores);
    setShowAddRound(true);
  };

  const handleSubmitRound = () => {
    if (!gameState) return;

    const scores: Record<string, number> = {};
    let valid = true;

    Object.entries(roundScores).forEach(([playerId, scoreStr]) => {
      const score = parseInt(scoreStr);
      if (isNaN(score) || score < 0) {
        valid = false;
      }
      scores[playerId] = score;
    });

    if (!valid) {
      toast({
        title: "Invalid Scores",
        description: "Please enter valid scores for all players.",
        variant: "destructive"
      });
      return;
    }

    const newRound = {
      roundNumber: gameState.rounds.length + 1,
      shufflerId: currentShufflerId,
      scores
    };

    const updatedGameState = updatePlayerScores(gameState, scores);
    updatedGameState.rounds.push(newRound);

    const activePlayers = updatedGameState.players.filter(p => p.status === 'active');
    
    if (activePlayers.length === 1) {
      updatedGameState.isFinished = true;
      saveGameState(updatedGameState);
      setGameState(updatedGameState);
      setShowAddRound(false);
      setShowFinalOverlay(true);
      return;
    }

    saveGameState(updatedGameState);
    setGameState(updatedGameState);
    setShowAddRound(false);

    const winnerIds = getRoundWinner(scores);
    const winnerNames = winnerIds.map(id => 
      updatedGameState.players.find(p => p.id === id)?.name || ''
    );
    setRoundWinnerNames(winnerNames);
    setShowWinnerOverlay(true);

    const nextShuffler = getNextShuffler(updatedGameState.players, currentShufflerId);
    setCurrentShufflerId(nextShuffler);
  };

  const handleAddPlayer = () => {
    if (!gameState || !newPlayerName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please enter a player name.",
        variant: "destructive"
      });
      return;
    }

    const updatedGameState = addPlayerToGame(gameState, newPlayerName.trim());
    saveGameState(updatedGameState);
    setGameState(updatedGameState);
    setNewPlayerName('');
    setShowAddPlayer(false);
    
    toast({
      title: "Player Added",
      description: `${newPlayerName} has joined the game.`,
    });
  };

  const handleWithdraw = (playerId: string) => {
    setWithdrawPlayerId(playerId);
    setShowWithdrawDialog(true);
  };

  const confirmWithdraw = () => {
    if (!gameState || !withdrawPlayerId) return;

    const { gameState: updatedGameState, payout } = withdrawPlayer(gameState, withdrawPlayerId);
    saveGameState(updatedGameState);
    setGameState(updatedGameState);
    setShowWithdrawDialog(false);
    setWithdrawPlayerId('');

    const player = gameState.players.find(p => p.id === withdrawPlayerId);
    toast({
      title: "Player Withdrawn",
      description: `${player?.name} withdrew and received ₹${payout.toFixed(2)}.`,
    });
  };

  const handleRejoin = (playerId: string) => {
    if (!gameState) return;
    const activePlayers = gameState.players.filter(p => p.status === 'active');
    setRejoinPlayerId(playerId);
    setRejoinShufflerPosition(activePlayers.length);
    setShowRejoinDialog(true);
  };

  const confirmRejoin = () => {
    if (!gameState || !rejoinPlayerId) return;

    const updatedGameState = rejoinPlayer(gameState, rejoinPlayerId, rejoinShufflerPosition);
    saveGameState(updatedGameState);
    setGameState(updatedGameState);
    setShowRejoinDialog(false);
    setRejoinPlayerId('');

    const player = gameState.players.find(p => p.id === rejoinPlayerId);
    toast({
      title: "Player Rejoined",
      description: `${player?.name} has rejoined the game at position ${rejoinShufflerPosition + 1}.`,
    });
  };

  const handleUndo = () => {
    if (!gameState || gameState.rounds.length === 0) return;

    const lastRound = gameState.rounds[gameState.rounds.length - 1];
    const updatedPlayers = gameState.players.map(player => {
      const roundScore = lastRound.scores[player.id] || 0;
      const newTotalScore = player.totalScore - roundScore;
      const newStatus = newTotalScore >= gameState.targetPoints ? 'eliminated' : 
                       (player.status === 'eliminated' && newTotalScore < gameState.targetPoints) ? 'active' : player.status;
      return {
        ...player,
        totalScore: newTotalScore,
        status: newStatus
      };
    });

    const playersWithShares = calculateShares(updatedPlayers);

    const updatedGameState: GameState = {
      ...gameState,
      players: playersWithShares,
      rounds: gameState.rounds.slice(0, -1)
    };

    saveGameState(updatedGameState);
    setGameState(updatedGameState);

    if (updatedGameState.rounds.length > 0) {
      const previousRound = updatedGameState.rounds[updatedGameState.rounds.length - 1];
      const nextShuffler = getNextShuffler(updatedGameState.players, previousRound.shufflerId);
      setCurrentShufflerId(nextShuffler);
    }

    toast({
      title: "Round Undone",
      description: "The last round has been removed.",
    });
  };

  const handleFinishGame = () => {
    setShowFinishDialog(true);
  };

  const confirmFinishGame = () => {
    if (!gameState) return;

    const updatedGameState = { ...gameState, isFinished: true };
    saveGameState(updatedGameState);
    setGameState(updatedGameState);
    setShowFinishDialog(false);
    setShowFinalOverlay(true);
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const activePlayers = gameState.players.filter(p => p.status === 'active');
  const minScore = activePlayers.length > 0 ? Math.min(...activePlayers.map(p => p.totalScore)) : 0;
  const playerToWithdraw = gameState.players.find(p => p.id === withdrawPlayerId);
  const withdrawPayout = playerToWithdraw ? playerToWithdraw.currentShare * gameState.totalPool * 0.75 : 0;
  const playerToRejoin = gameState.players.find(p => p.id === rejoinPlayerId);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground p-4 shadow-elevated sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-3 text-primary-foreground hover:bg-white/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Home
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">Target: {gameState.targetPoints} pts</p>
              <p className="text-2xl font-bold">Game #{gameState.gameId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Total Pool</p>
              <p className="text-3xl font-bold">₹{gameState.totalPool.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Player Cards */}
      <div className="max-w-2xl mx-auto p-4 space-y-3 animate-fade-in relative">
        {/* Decorative Cards */}
        <div className="absolute -top-4 -left-2 text-3xl opacity-20 animate-card-float">🂡</div>
        <div className="absolute top-1/3 -right-2 text-2xl opacity-20 animate-card-float" style={{ animationDelay: '1s' }}>🃁</div>
        
        {gameState.players.map(player => (
          <div key={player.id} className="relative">
            <PlayerCard
              player={player}
              totalPool={gameState.totalPool}
              isWinning={player.status === 'active' && player.totalScore === minScore}
            />
            {!spectatorMode && (
              <div className="absolute top-2 right-2 flex gap-2">
                {player.status === 'active' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleWithdraw(player.id)}
                    className="h-7 text-xs"
                  >
                    Withdraw
                  </Button>
                )}
                {player.status !== 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejoin(player.id)}
                    className="h-7 text-xs"
                  >
                    Rejoin
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Actions (Creator Only) */}
      {!spectatorMode && !gameState.isFinished && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-elevated">
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
            <Button
              onClick={handleOpenAddRound}
              className="bg-primary text-primary-foreground font-semibold h-12"
            >
              🎴 Add Round
            </Button>
            <Button
              onClick={handleUndo}
              disabled={gameState.rounds.length === 0}
              variant="outline"
              className="h-12"
            >
              <Undo className="mr-2 h-4 w-4" />
              Undo
            </Button>
            <Button
              onClick={() => setShowAddPlayer(true)}
              variant="secondary"
              className="h-12"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
            <Button
              onClick={handleFinishGame}
              variant="outline"
              className="h-12"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Finish Game
            </Button>
          </div>
        </div>
      )}

      {/* Add Round Dialog */}
      <Dialog open={showAddRound} onOpenChange={setShowAddRound}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="animate-card-shuffle text-2xl">🎴</span>
              Round {gameState.rounds.length + 1}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <span className="font-semibold">🃏 Shuffler:</span> 
              {gameState.players.find(p => p.id === currentShufflerId)?.name || 'Unknown'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {activePlayers.map(player => (
              <div key={player.id} className="flex items-center gap-3">
                <Label className="flex-1 font-semibold">{player.name}</Label>
                <Input
                  type="number"
                  value={roundScores[player.id] || ''}
                  onChange={(e) => setRoundScores({ ...roundScores, [player.id]: e.target.value })}
                  className="w-24 text-center"
                  placeholder="0"
                  min="0"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRound(false)}>Cancel</Button>
            <Button onClick={handleSubmitRound}>Submit Scores</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Player Dialog */}
      <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>
              Entry fee: ₹{gameState.amountPerPlayer}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPlayerName">Player Name</Label>
              <Input
                id="newPlayerName"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPlayer(false)}>Cancel</Button>
            <Button onClick={handleAddPlayer}>Add Player</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Confirmation */}
      <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Player?</AlertDialogTitle>
            <AlertDialogDescription>
              {playerToWithdraw?.name} will receive ₹{withdrawPayout.toFixed(2)} (75% of their share).
              The remaining 25% will be forfeited to the pool.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmWithdraw}>Confirm Withdraw</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejoin Confirmation */}
      <Dialog open={showRejoinDialog} onOpenChange={setShowRejoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejoin Game</DialogTitle>
            <DialogDescription>
              {playerToRejoin?.name} will rejoin with an entry fee of ₹{gameState.amountPerPlayer}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="shufflerPosition">Shuffler Position</Label>
              <select
                id="shufflerPosition"
                value={rejoinShufflerPosition}
                onChange={(e) => setRejoinShufflerPosition(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
              >
                {gameState.players
                  .filter(p => p.status === 'active')
                  .map((_, index) => (
                    <option key={index} value={index}>
                      Position {index + 1}
                    </option>
                  ))}
                <option value={gameState.players.filter(p => p.status === 'active').length}>
                  Position {gameState.players.filter(p => p.status === 'active').length + 1} (Last)
                </option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejoinDialog(false)}>Cancel</Button>
            <Button onClick={confirmRejoin}>Confirm Rejoin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finish Game Confirmation */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finish Game?</AlertDialogTitle>
            <AlertDialogDescription>
              The prize pool will be distributed among active players based on their current shares.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFinishGame}>Finish Game</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Round Winner Overlay */}
      {showWinnerOverlay && (
        <ConfettiOverlay
          winnerNames={roundWinnerNames}
          onComplete={() => setShowWinnerOverlay(false)}
        />
      )}

      {/* Final Scoreboard Overlay */}
      {showFinalOverlay && (
        <MoneyShowerOverlay
          players={gameState.players}
          totalPool={gameState.totalPool}
          onClose={() => {
            setShowFinalOverlay(false);
            navigate('/');
          }}
        />
      )}
    </div>
  );
};

export default GameBoard;
