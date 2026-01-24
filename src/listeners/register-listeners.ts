import type { Bot } from "grammy";
import type { LoadedConfig } from "../config/load-config.js";
import messageListener from "./message.js";
import editedMessageListener from "./edited_message.js";
import statsListener from "./stats.js";
import gtaListener from "./gta.js";

export const registerListeners = (bot: Bot, config: LoadedConfig) => {
  // Register specific listeners first (commands, reactions, etc.)
  gtaListener(bot);
  statsListener(bot, config);

  // Register general listeners last (catch-all message handlers)
  messageListener(bot);
  editedMessageListener(bot);
};
