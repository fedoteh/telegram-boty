import type { Bot } from "grammy";
import type { LoadedConfig } from "../config/load-config.js";
import messageListener from "./message.js";
import editedMessageListener from "./edited_message.js";
import statsListener from "./stats.js";

export const registerListeners = (bot: Bot, config: LoadedConfig) => {
  statsListener(bot, config);
  messageListener(bot);
  editedMessageListener(bot);
};
