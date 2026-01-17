import type { Bot } from "grammy";
import messageListener from "./message.js";
import editedMessageListener from "./edited_message.js";

export const registerListeners = (bot: Bot) => {
  messageListener(bot);
  editedMessageListener(bot);
};
