import type { Bot } from "grammy";
import messageHandler from "../handlers/message.js";
import { rememberMessageText } from "../utils/message-text-cache.js";

const messageListener = (bot: Bot) => {
  bot.on("message", async (ctx) => {
    const text = ctx.message?.text ?? ctx.msg?.text ?? "";
    rememberMessageText(ctx.chat?.id, ctx.msg?.message_id, text);

    const messageResponse = messageHandler(text);
    if (messageResponse) {
      await ctx.reply(messageResponse);
    }
  });
};

export default messageListener;