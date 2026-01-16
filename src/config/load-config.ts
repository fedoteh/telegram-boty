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

const isValidBotConfig = (data: unknown): data is BotConfig =>
  typeof data === "object" &&
  data !== null &&
  "squads" in data &&
  "defaults" in data;

export const loadBotConfig = (): LoadedConfig => {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const botConfigData: unknown = JSON.parse(raw);

  if (!isValidBotConfig(botConfigData)) {
    throw new Error(`Missing configuration file data at ${CONFIG_PATH}`);
  }

  return {
    squads: buildSquadMap(botConfigData.squads),
    defaults: botConfigData.defaults,
  };
};