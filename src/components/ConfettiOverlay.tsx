import { useEffect, useState } from 'react';

interface ConfettiOverlayProps {
  winnerNames: string[];
  onComplete: () => void;
}

const ConfettiOverlay = ({ winnerNames, onComplete }: ConfettiOverlayProps) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: string; delay: string; color: string }>>([]);

  useEffect(() => {
    const colors = ['hsl(262 83% 58%)', 'hsl(45 93% 58%)', 'hsl(142 71% 45%)', 'hsl(230 75% 60%)'];
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.5}s`,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setConfetti(pieces);

    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: piece.left,
            backgroundColor: piece.color,
            animationDelay: piece.delay
          }}
        />
      ))}
      <div className="bg-card rounded-2xl p-8 shadow-elevated max-w-sm mx-4 text-center animate-slide-up">
        <h2 className="text-3xl font-bold mb-2 text-primary">🎉 Round Winner!</h2>
        <p className="text-xl font-semibold text-foreground">
          {winnerNames.join(' & ')}
        </p>
      </div>
    </div>
  );
};

export default ConfettiOverlay;
