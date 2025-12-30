import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { BotConfig } from "../types/config.js";
import type { SquadConfig } from "../types/squads.js";
import { buildSquadMap } from "../utils/squad-validation.js";

export type LoadedConfig = {
  squads: Record<string, SquadConfig>;
  defaults: BotConfig["defaults"];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dist/config/load-config.js -> /app/dist/config
// config file is baked into image at /app/config/bot-config.json
const CONFIG_PATH = path.resolve(__dirname, "../../config/bot-config.json");

export const loadBotConfig = (): LoadedConfig => {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const botConfigData = JSON.parse(raw) as Partial<BotConfig>;

  if (!botConfigData?.squads || !botConfigData?.defaults) {
    throw new Error(`Missing configuration file data at ${CONFIG_PATH}`);
  }

  const botConfig = botConfigData as BotConfig;
  const squads = buildSquadMap(botConfig.squads);

  return {
    squads,
    defaults: botConfig.defaults,
  };
};