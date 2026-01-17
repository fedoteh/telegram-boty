import type { Bot } from "grammy";
import messageHandler from "../handlers/message.js";

const messageListener = (bot: Bot) => {
  bot.on("message", async (ctx) => {
    const text = ctx.message?.text ?? ctx.msg?.text ?? "";

    const messageResponse = messageHandler(text);
    if (messageResponse) {
      await ctx.reply(messageResponse);
    }
  });
};

export default messageListener;