import type { Bot } from "grammy";

const editedMessageListener = (bot: Bot) => {
  bot.on("edited_message:text", async (ctx) => {
    // Only react to actual text edits, not reaction changes
    // When a message is genuinely edited, edit_date is always present
    // This filters out "phantom" edits triggered by reactions or other internal changes
    if (!ctx.msg.edit_date) {
      return;
    }

    await ctx.api.setMessageReaction(ctx.chat.id, ctx.msg.message_id, [
      { type: "emoji", emoji: "🌚" },
    ]);
  });
};

export default editedMessageListener;
