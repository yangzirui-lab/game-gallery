export type GameStatus = "playing" | "pending" | "completion";

export interface Game {
  id: string;
  name: string;
  status: GameStatus;
  addedAt: string;
  lastUpdated: string;
  steamUrl?: string;
  coverImage?: string;
}

export interface GameQueueData {
  games: Game[];
}
