import type { Bot } from "grammy";
import { hasMessageTextChanged } from "../utils/message-text-cache.js";

type EditedMessageOptions = {
  replyText?: string;
};

const editedMessageListener = (bot: Bot, options: EditedMessageOptions = {}) => {
  const replyText = options.replyText?.trim();

  if (!replyText) {
    return;
  }

  bot.on("edited_message", async (ctx) => {
    const editedMessage = ctx.msg;

    // Skip media-only edits so the bot only reacts to text changes
    if (!editedMessage?.text) {
      return;
    }

    const textChanged = hasMessageTextChanged(ctx.chat?.id, editedMessage.message_id, editedMessage.text);
    if (!textChanged) {
      return;
    }

    await ctx.api.setMessageReaction(ctx.chat?.id, editedMessage.message_id, [
        { type: "emoji", emoji: "🌚" },
    ]);
    
  });
};

export default editedMessageListener;
