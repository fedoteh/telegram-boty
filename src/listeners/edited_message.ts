import type { Bot } from "grammy";

const editedMessageListener = (bot: Bot) => {
  bot.on("edited_message:text", async (ctx) => {
    await ctx.api.setMessageReaction(ctx.chat.id, ctx.msg.message_id, [
      { type: "emoji", emoji: "🌚" },
    ]);
  });
};

export default editedMessageListener;
