export type StatsPlayer = {
  handle: string;
  platformId: string;
};

export type GameStats = {
  platform: string;
  players: StatsPlayer[];
};

export type StatsConfig = {
  games: Record<string, GameStats>;
};
