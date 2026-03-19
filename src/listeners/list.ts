import type { Bot } from "grammy";
import { listGroups } from "../db/queries/game-groups.js";

/**
 * /list
 *
 * Lists all game groups in the current chat.
 */
const listListener = (bot: Bot) => {
  bot.command("list", async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    const groups = await listGroups(BigInt(chatId));

    if (groups.length === 0) {
      await ctx.reply(
        "No hay game groups en este chat 🤷\n\nCreá uno con `/create <nombre>`",
        { parse_mode: "Markdown" },
      );
      return;
    }

    let reply = "🎮 *Game groups disponibles:*\n\n";

    for (const group of groups) {
      const memberCount = group.members.length;
      reply += `• /${group.name} — ${memberCount} miembro${memberCount !== 1 ? "s" : ""}\n`;
    }

    reply += `\nUsá el comando (ej: \`/${groups[0]?.name}\`) para convocar al grupo!`;

    await ctx.reply(reply, { parse_mode: "Markdown" });
  });
};

export default listListener;
