import { Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: Player;
  totalPool: number;
  isWinning: boolean;
}

const PlayerCard = ({ player, totalPool, isWinning }: PlayerCardProps) => {
  const shareAmount = player.currentShare * totalPool;
  
  return (
    <div
      className={cn(
        "bg-gradient-card p-4 rounded-xl shadow-card transition-all duration-300",
        isWinning && player.status === 'active' && "ring-2 ring-success shadow-lg scale-[1.02]",
        player.status !== 'active' && "opacity-50"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={cn(
          "text-lg font-bold",
          player.status !== 'active' && "line-through"
        )}>
          {player.name}
        </h3>
        {player.status !== 'active' && (
          <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground capitalize">
            {player.status}
          </span>
        )}
      </div>
      
      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm text-muted-foreground">Points</p>
          <p className="text-2xl font-bold text-primary">{player.totalScore}</p>
        </div>
        
        {player.status === 'active' && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Share</p>
            <p className="text-xl font-bold text-success">₹{shareAmount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {(player.currentShare * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
