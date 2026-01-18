export type DotaPlayerProfile = {
  accountId: number;
  personaname: string;
  avatarmedium: string;
  rankTier: number | null;
  fhUnavailable: boolean;
};

export type DotaWinLoss = {
  win: number;
  lose: number;
};

export type DotaRecentMatch = {
  matchId: number;
  playerSlot: number;
  radiantWin: boolean;
  duration: number;
  gameMode: number;
  heroId: number;
  kills: number;
  deaths: number;
  assists: number;
  startTime: number;
};

export type DotaTotals = {
  totalDurationSeconds: number;
  totalMatches: number;
};

export type DotaStats = {
  profile: DotaPlayerProfile;
  winLoss: DotaWinLoss;
  recentMatches: DotaRecentMatch[];
};
