export type PlayerStatus = 'active' | 'eliminated' | 'withdrawn';

export interface Player {
  id: string;
  name: string;
  totalScore: number;
  status: PlayerStatus;
  currentShare: number;
}

export interface Round {
  roundNumber: number;
  shufflerId: string;
  scores: Record<string, number>;
}

export interface GameState {
  gameId: string;
  targetPoints: number;
  amountPerPlayer: number;
  players: Player[];
  rounds: Round[];
  totalPool: number;
  createdAt: number;
  isFinished: boolean;
}
