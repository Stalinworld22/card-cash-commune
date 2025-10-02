import { useEffect, useState } from 'react';
import { Player } from '@/types/game';

interface MoneyShowerOverlayProps {
  players: Player[];
  totalPool: number;
  onClose: () => void;
}

const MoneyShowerOverlay = ({ players, totalPool, onClose }: MoneyShowerOverlayProps) => {
  const [money, setMoney] = useState<Array<{ id: number; left: string; delay: string }>>([]);
  
  const sortedPlayers = [...players]
    .filter(p => p.status === 'active')
    .sort((a, b) => a.totalScore - b.totalScore);

  const winner = sortedPlayers.length > 0 ? sortedPlayers[0] : null;

  useEffect(() => {
    const pieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 1}s`
    }));
    setMoney(pieces);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {money.map((piece) => (
        <div
          key={piece.id}
          className="absolute text-4xl animate-money-fall"
          style={{
            left: piece.left,
            animationDelay: piece.delay
          }}
        >
          💰
        </div>
      ))}
      
      <div className="bg-card rounded-2xl p-8 shadow-elevated max-w-md mx-4 w-full animate-slide-up">
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-primary bg-clip-text text-transparent">
          🏆 Game Over!
        </h2>
        
        {winner && (
          <div className="mb-6 p-4 bg-gradient-success rounded-xl text-center">
            <p className="text-sm font-medium text-success-foreground/80 mb-1">Winner</p>
            <p className="text-2xl font-bold text-success-foreground">{winner.name}</p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {sortedPlayers.map((player, index) => {
            const share = player.currentShare * totalPool;
            return (
              <div 
                key={player.id}
                className="flex justify-between items-center p-3 bg-secondary rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">#{index + 1}</span>
                  <span className="font-semibold">{player.name}</span>
                  <span className="text-sm text-muted-foreground">({player.totalScore})</span>
                </div>
                <span className="font-bold text-success">₹{share.toFixed(4)}</span>
              </div>
            );
          })}
          
          {players.filter(p => p.status !== 'active').map(player => (
            <div 
              key={player.id}
              className="flex justify-between items-center p-3 bg-muted/50 rounded-lg opacity-60"
            >
              <span className="font-medium line-through">{player.name}</span>
              <span className="text-sm text-muted-foreground capitalize">{player.status}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MoneyShowerOverlay;
