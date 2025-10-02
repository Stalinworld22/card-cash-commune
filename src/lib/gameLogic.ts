import { GameState, Player, PlayerStatus } from '@/types/game';

export const generateGameId = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const saveGameState = (gameState: GameState): void => {
  localStorage.setItem(`rummy_game_${gameState.gameId}`, JSON.stringify(gameState));
};

export const loadGameState = (gameId: string): GameState | null => {
  const saved = localStorage.getItem(`rummy_game_${gameId}`);
  return saved ? JSON.parse(saved) : null;
};

export const calculateShares = (players: Player[]): Player[] => {
  const activePlayers = players.filter(p => p.status === 'active');
  
  if (activePlayers.length === 0) {
    return players;
  }

  const allScoresZero = activePlayers.every(p => p.totalScore === 0);
  
  if (allScoresZero) {
    const equalShare = 1 / activePlayers.length;
    return players.map(p => ({
      ...p,
      currentShare: p.status === 'active' ? equalShare : 0
    }));
  }

  const maxScore = Math.max(...activePlayers.map(p => p.totalScore));
  const inverseScores = activePlayers.map(p => maxScore - p.totalScore + 1);
  const totalInverse = inverseScores.reduce((sum, score) => sum + score, 0);

  let shareIndex = 0;
  return players.map(p => {
    if (p.status !== 'active') {
      return { ...p, currentShare: 0 };
    }
    const share = inverseScores[shareIndex] / totalInverse;
    shareIndex++;
    return { ...p, currentShare: share };
  });
};

export const getNextShuffler = (players: Player[], currentShufflerId: string): string => {
  const activePlayers = players.filter(p => p.status === 'active');
  const currentIndex = activePlayers.findIndex(p => p.id === currentShufflerId);
  const nextIndex = (currentIndex + 1) % activePlayers.length;
  return activePlayers[nextIndex].id;
};

export const updatePlayerScores = (
  gameState: GameState,
  roundScores: Record<string, number>
): GameState => {
  const updatedPlayers = gameState.players.map(player => {
    if (player.status !== 'active') return player;
    
    const roundScore = roundScores[player.id] || 0;
    const newTotalScore = player.totalScore + roundScore;
    const newStatus: PlayerStatus = 
      newTotalScore >= gameState.targetPoints ? 'eliminated' : 'active';
    
    return {
      ...player,
      totalScore: newTotalScore,
      status: newStatus
    };
  });

  const playersWithShares = calculateShares(updatedPlayers);
  
  return {
    ...gameState,
    players: playersWithShares
  };
};

export const addPlayerToGame = (
  gameState: GameState,
  playerName: string
): GameState => {
  const activePlayers = gameState.players.filter(p => p.status === 'active');
  const maxScore = activePlayers.length > 0 
    ? Math.max(...activePlayers.map(p => p.totalScore))
    : 0;

  const newPlayer: Player = {
    id: Date.now().toString(),
    name: playerName,
    totalScore: maxScore,
    status: 'active',
    currentShare: 0
  };

  const updatedPlayers = [...gameState.players, newPlayer];
  const playersWithShares = calculateShares(updatedPlayers);

  return {
    ...gameState,
    players: playersWithShares,
    totalPool: gameState.totalPool + gameState.amountPerPlayer
  };
};

export const withdrawPlayer = (
  gameState: GameState,
  playerId: string
): { gameState: GameState; payout: number } => {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return { gameState, payout: 0 };

  const payout = player.currentShare * gameState.totalPool * 0.75;
  
  const updatedPlayers = gameState.players.map(p =>
    p.id === playerId ? { ...p, status: 'withdrawn' as PlayerStatus, currentShare: 0 } : p
  );

  const playersWithShares = calculateShares(updatedPlayers);

  return {
    gameState: {
      ...gameState,
      players: playersWithShares,
      totalPool: gameState.totalPool - payout
    },
    payout
  };
};

export const rejoinPlayer = (
  gameState: GameState,
  playerId: string
): GameState => {
  const activePlayers = gameState.players.filter(p => p.status === 'active');
  const maxScore = activePlayers.length > 0 
    ? Math.max(...activePlayers.map(p => p.totalScore))
    : 0;

  const updatedPlayers = gameState.players.map(p =>
    p.id === playerId 
      ? { ...p, status: 'active' as PlayerStatus, totalScore: maxScore }
      : p
  );

  const playersWithShares = calculateShares(updatedPlayers);

  return {
    ...gameState,
    players: playersWithShares,
    totalPool: gameState.totalPool + gameState.amountPerPlayer
  };
};

export const getRoundWinner = (roundScores: Record<string, number>): string[] => {
  const scores = Object.entries(roundScores);
  if (scores.length === 0) return [];
  
  const minScore = Math.min(...scores.map(([_, score]) => score));
  return scores.filter(([_, score]) => score === minScore).map(([id]) => id);
};
