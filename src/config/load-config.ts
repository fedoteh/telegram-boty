import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { BotConfig } from "../types/config.js";
import type { SquadConfig } from "../types/squads.js";
import type { StatsConfig } from "../types/stats.js";
import { buildSquadMap } from "../utils/squad-validation.js";

export type LoadedConfig = {
  squads: Record<string, SquadConfig>;
  defaults: BotConfig["defaults"];
  stats?: StatsConfig;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dist/config/load-config.js -> /app/dist/config
// config file is baked into image at /app/config/bot-config.json
const CONFIG_PATH = path.resolve(__dirname, "../../config/bot-config.json");

const isValidBotConfig = (data: unknown): data is BotConfig =>
  typeof data === "object" &&
  data !== null &&
  "squads" in data &&
  "defaults" in data;

const isValidStatsConfig = (data: unknown): data is StatsConfig => {
  if (typeof data !== "object" || data === null) return false;
  if (!("games" in data)) return false;

  const { games } = data as { games: unknown };
  if (typeof games !== "object" || games === null) return false;

  for (const game of Object.values(games)) {
    if (typeof game !== "object" || game === null) return false;
    const gameConfig = game as Record<string, unknown>;
    if (typeof gameConfig.platform !== "string") return false;
    if (!Array.isArray(gameConfig.players)) return false;

    for (const player of gameConfig.players) {
      if (typeof player !== "object" || player === null) return false;
      const playerConfig = player as Record<string, unknown>;
      if (typeof playerConfig.handle !== "string") return false;
      if (typeof playerConfig.platformId !== "string") return false;
    }
  }

  return true;
};

export const loadBotConfig = (): LoadedConfig => {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const botConfigData: unknown = JSON.parse(raw);

  if (!isValidBotConfig(botConfigData)) {
    throw new Error(`Missing configuration file data at ${CONFIG_PATH}`);
  }

  const baseConfig: LoadedConfig = {
    squads: buildSquadMap(botConfigData.squads),
    defaults: botConfigData.defaults,
  };

  if ("stats" in botConfigData && isValidStatsConfig(botConfigData.stats)) {
    baseConfig.stats = botConfigData.stats;
  }

  return baseConfig;
};