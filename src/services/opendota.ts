import type {
  DotaPlayerProfile,
  DotaWinLoss,
  DotaRecentMatch,
  DotaTotals,
} from "../types/dota.js";

const OPENDOTA_API_BASE = "https://api.opendota.com/api";

type OpenDotaPlayerResponse = {
  profile?: {
    account_id?: number;
    personaname?: string;
    avatarmedium?: string;
    fh_unavailable?: boolean;
  };
  rank_tier?: number | null;
};

type OpenDotaWinLossResponse = {
  win?: number;
  lose?: number;
};

type OpenDotaMatchResponse = {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  duration: number;
  game_mode: number;
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
  start_time: number;
};

type OpenDotaTotalsResponse = {
  field: string;
  n: number;
  sum: number;
};

/**
 * Fetches player profile from OpenDota API
 */
const fetchPlayerProfile = async (
  accountId: string
): Promise<DotaPlayerProfile | null> => {
  try {
    const response = await fetch(`${OPENDOTA_API_BASE}/players/${accountId}`);
    if (!response.ok) return null;

    const data = (await response.json()) as OpenDotaPlayerResponse;
    return {
      accountId: data.profile?.account_id ?? 0,
      personaname: data.profile?.personaname ?? "Unknown",
      avatarmedium: data.profile?.avatarmedium ?? "",
      rankTier: data.rank_tier ?? null,
      fhUnavailable: data.profile?.fh_unavailable ?? true,
    };
  } catch {
    return null;
  }
};

/**
 * Fetches win/loss stats from OpenDota API
 */
const fetchWinLoss = async (accountId: string): Promise<DotaWinLoss | null> => {
  try {
    const response = await fetch(`${OPENDOTA_API_BASE}/players/${accountId}/wl`);
    if (!response.ok) return null;

    const data = (await response.json()) as OpenDotaWinLossResponse;
    return {
      win: data.win ?? 0,
      lose: data.lose ?? 0,
    };
  } catch {
    return null;
  }
};

/**
 * Fetches recent matches from OpenDota API
 */
const fetchRecentMatches = async (
  accountId: string,
  limit = 20
): Promise<DotaRecentMatch[]> => {
  try {
    const response = await fetch(
      `${OPENDOTA_API_BASE}/players/${accountId}/recentMatches`
    );
    if (!response.ok) return [];

    const data = (await response.json()) as OpenDotaMatchResponse[];
    return data.slice(0, limit).map((match) => ({
      matchId: match.match_id,
      playerSlot: match.player_slot,
      radiantWin: match.radiant_win,
      duration: match.duration,
      gameMode: match.game_mode,
      heroId: match.hero_id,
      kills: match.kills,
      deaths: match.deaths,
      assists: match.assists,
      startTime: match.start_time,
    }));
  } catch {
    return [];
  }
};

/**
 * Calculates win/loss from matches within the last N days
 */
const calculateWinLossFromMatches = (
  matches: DotaRecentMatch[],
  days: number
): DotaWinLoss => {
  const cutoffTime = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
  const recentMatches = matches.filter((m) => m.startTime >= cutoffTime);

  let wins = 0;
  let losses = 0;

  for (const match of recentMatches) {
    const isRadiant = match.playerSlot < 128;
    const won = isRadiant === match.radiantWin;
    if (won) {
      wins++;
    } else {
      losses++;
    }
  }

  return { win: wins, lose: losses };
};

/**
 * Fetches total playtime from OpenDota API
 */
const fetchTotals = async (accountId: string): Promise<DotaTotals | null> => {
  try {
    const response = await fetch(
      `${OPENDOTA_API_BASE}/players/${accountId}/totals`
    );
    if (!response.ok) return null;

    const data = (await response.json()) as OpenDotaTotalsResponse[];
    const durationEntry = data.find((entry) => entry.field === "duration");

    if (!durationEntry) return null;

    return {
      totalDurationSeconds: durationEntry.sum,
      totalMatches: durationEntry.n,
    };
  } catch {
    return null;
  }
};

/**
 * Determines if player won based on player slot and radiant win
 */
const didPlayerWin = (playerSlot: number, radiantWin: boolean): boolean => {
  const isRadiant = playerSlot < 128;
  return isRadiant === radiantWin;
};

/**
 * Converts rank tier to medal name
 */
const getRankName = (rankTier: number | null): string => {
  if (!rankTier) return "Está verde este...";

  const medals = [
    "Herald",
    "Guardian",
    "Crusader",
    "Archon",
    "Legend",
    "Ancient",
    "Divine",
    "Immortal",
  ];
  const tier = Math.floor(rankTier / 10);
  const stars = rankTier % 10;

  if (tier < 1 || tier > 8) return "Unknown";

  const medalName = medals[tier - 1] ?? "Unknown";
  return tier === 8 ? medalName : `${medalName} ${stars}`;
};

/**
 * Formats match duration from seconds to MM:SS
 */
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Formats total playtime from seconds to hours
 */
const formatPlaytime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1000) {
    return `${(hours / 1000).toFixed(1)}k horas`;
  }
  return `${hours} horas`;
};

/**
 * Fetches complete Dota 2 stats for a player
 */
export const fetchDotaStats = async (
  accountId: string
): Promise<{ success: boolean; message: string }> => {
  const [profile, winLoss, recentMatches, totals] = await Promise.all([
    fetchPlayerProfile(accountId),
    fetchWinLoss(accountId),
    fetchRecentMatches(accountId, 20),
    fetchTotals(accountId),
  ]);

  if (!profile) {
    return {
      success: false,
      message: `No pude encontrar el perfil con ID ${accountId}. ¿Será que el gonca 💩 está privado?`,
    };
  }

  if (profile.fhUnavailable) {
    return {
      success: false,
      message:
        `🔒 **${profile.personaname}** tiene el perfil privado o no expone sus datos. Tremendo cagón.\n\n` +
        `Para arreglarlo:\n` +
        `1. Dota 2 → Opciones → Opciones Avanzadas → Activar "Exponer datos públicos de partidas"\n` +
        `2. Visitar https://www.opendota.com/players/${accountId} para sincronizar`,
    };
  }

  const winRate =
    winLoss && winLoss.win + winLoss.lose > 0
      ? ((winLoss.win / (winLoss.win + winLoss.lose)) * 100).toFixed(1)
      : "N/A";

  const rank = getRankName(profile.rankTier);

  let message = `🎮 **${profile.personaname}**\n`;
  message += `🏅 Rank: ${rank} (que desinstale pls)\n`;
  message += `📊 Win Rate: ${winRate}%`;

  if (winLoss) {
    message += ` (${winLoss.win}W - ${winLoss.lose}L) 🤣`;
  }

  // Calculate weekly stats from recent matches
  const weeklyWinLoss = calculateWinLossFromMatches(recentMatches, 7);
  if (weeklyWinLoss.win + weeklyWinLoss.lose > 0) {
    const weeklyWinRate = (
      (weeklyWinLoss.win / (weeklyWinLoss.win + weeklyWinLoss.lose)) *
      100
    ).toFixed(1);
    const opinion = parseFloat(weeklyWinRate) >= 50 ? "Zafa..." : "Por Dios y la virgen...";
    message += `\n📅 Última semana: ${weeklyWinRate}% (${weeklyWinLoss.win}W - ${weeklyWinLoss.lose}L) ${opinion}`;
  }

  if (totals) {
    message += `\n⏱️ Tiempo jugado: ${formatPlaytime(totals.totalDurationSeconds)} (${totals.totalMatches} partidas).\n(¿A vos te parece?)`;
    
  }

  // Show only the last 5 matches for display
  const displayMatches = recentMatches.slice(0, 5);
  if (displayMatches.length > 0) {
    message += `\n\n📜 Últimas ${displayMatches.length} partidas:\n`;

    displayMatches.forEach((match: DotaRecentMatch, index: number) => {
      const won = didPlayerWin(match.playerSlot, match.radiantWin);
      const result = won ? "✅" : "❌";
      const kda = `${match.kills}/${match.deaths}/${match.assists}`;
      const duration = formatDuration(match.duration);

      message += `${index + 1}. ${result} KDA: ${kda} (${duration})\n`;
    });
  }

  return {
    success: true,
    message,
  };
};
