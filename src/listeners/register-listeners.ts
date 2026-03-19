import type { Bot } from "grammy";
import type { LoadedConfig } from "../config/load-config.js";
import createListener from "./create.js";
import addListener from "./add.js";
import rmListener from "./rm.js";
import deleteListener from "./delete.js";
import listListener from "./list.js";
import messageListener from "./message.js";
import editedMessageListener from "./edited_message.js";
import statsListener from "./stats.js";
import gtaListener from "./gta.js";
import gameGroupCommandListener from "./game-group-command.js";

export const registerListeners = (bot: Bot, config: LoadedConfig) => {
  // Register specific commands first
  createListener(bot);
  addListener(bot);
  rmListener(bot);
  deleteListener(bot);
  listListener(bot);
  gtaListener(bot);
  statsListener(bot, config);

  // Dynamic game group commands (must be after all known commands)
  gameGroupCommandListener(bot);

  // Register general listeners last (catch-all message handlers)
  messageListener(bot);
  editedMessageListener(bot);
};
