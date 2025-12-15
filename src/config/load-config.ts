import botConfigData from "../../config/bot-config.json" with { type: "json" };
import type { BotConfig } from "../types/config.js";
import type { SquadConfig } from "../types/squads.js";
import { buildSquadMap } from "../utils/squad-validation.js";

export type LoadedConfig = {
  squads: Record<string, SquadConfig>;
  defaults: BotConfig["defaults"];
};

export const loadBotConfig = (): LoadedConfig => {
  if (!botConfigData?.squads || !botConfigData?.defaults) {
    throw new Error("Missing configuration file data");
  }

  const botConfig = botConfigData as BotConfig;
  const squads = buildSquadMap(botConfig.squads);

  return {
    squads,
    defaults: botConfig.defaults,
  };
};
