import type { StatsConfig } from "../types/stats.js";

export type StatsResult = {
  success: boolean;
  message: string;
  game?: string;
  handle?: string;
  platformId?: string;
  platform?: string;
};

const buildHelpMessage = (statsConfig: StatsConfig | undefined): string => {
  const lines = [
    "📊 *Stats command*",
    "",
    "Usage:",
    "• `/stats <game> <username>` — fetch stats for a player",
    "• `/stats help` — show this message",
    "",
    "Example: `/stats dota Fefi`",
  ];

  const games = statsConfig?.games;
  if (games && Object.keys(games).length > 0) {
    lines.push("", "*Available games and players:*");
    for (const [gameName, gameConfig] of Object.entries(games)) {
      const players = gameConfig.players.map((p) => p.handle).join(", ") || "(no players configured)";
      lines.push(`• *${gameName}* (${gameConfig.platform}): ${players}`);
    }
  } else {
    lines.push("", "No games are configured yet.");
  }

  return lines.join("\n");
};

/**
 * Parses the stats command arguments and returns player info for fetching stats
 * Format: <game> <handle>
 * Example: dota Fedoteh
 * Special: `help` shows usage and configured games/players.
 */
export const parseStatsArgs = (
  args: string,
  statsConfig: StatsConfig | undefined
): StatsResult => {
  const trimmed = args.trim();

  if (trimmed === "" || trimmed.toLowerCase() === "help") {
    return {
      success: false,
      message: buildHelpMessage(statsConfig),
    };
  }

  const argsRegex = /^(\S+)\s+(\S+)$/i;
  const match = trimmed.match(argsRegex);

  if (!match) {
    return {
      success: false,
      message: "Usage: /stats <game> <username>\nExample: /stats dota Kossay\nType /stats help for more info.",
    };
  }

  const [, gameName, handle] = match as [string, string, string];
  const normalizedGame = gameName.toLowerCase();
  // Normalize handle: strip @ if provided (users might still tag by habit)
  const normalizedHandle = handle.startsWith("@") ? handle.slice(1) : handle;

  if (!statsConfig?.games) {
    return {
      success: false,
      message: "NPI que me estás pidiendo.",
    };
  }

  const gameConfig = statsConfig.games[normalizedGame];

  if (!gameConfig) {
    const availableGames = Object.keys(statsConfig.games).join(", ");
    return {
      success: false,
      message: `Nunca configuramos "${gameName}". Pedite uno que sepamos todos, e.g., ${availableGames}`,
    };
  }

  const player = gameConfig.players.find(
    (p) => p.handle.toLowerCase() === normalizedHandle.toLowerCase()
  );

  if (!player) {
    const availablePlayers = gameConfig.players.map((p) => p.handle).join(", ");
    return {
      success: false,
      message: `No me agregaron "${normalizedHandle}" para el ${gameName}. Los bobis que tengo son: ${availablePlayers}`,
    };
  }

  if (!player.platformId) {
    return {
      success: false,
      message: 'No tengo el ID de la plataforma para este bobi. Pedile el famoso "Friend Code".',
    };
  }

  return {
    success: true,
    message: `📊 Stats for ${player.handle} in ${gameName}:\nPlatform: ${gameConfig.platform}\nPlatform ID: ${player.platformId}`,
    game: normalizedGame,
    handle: player.handle,
    platformId: player.platformId,
    platform: gameConfig.platform,
  };
};
