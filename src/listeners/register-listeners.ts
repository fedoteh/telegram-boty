import type { Bot } from "grammy";
import messageListener from "./message.js";
import editedMessageListener from "./edited_message.js";
import type { DefaultsConfig } from "../types/config.js";

export const registerListeners = (bot: Bot, defaults: DefaultsConfig) => {
  messageListener(bot);

  const replyText = defaults.editedMessageReply?.trim();
  editedMessageListener(bot, replyText ? { replyText } : undefined);
};
