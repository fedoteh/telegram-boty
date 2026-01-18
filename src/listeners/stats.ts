import type { Bot } from "grammy";
import type { LoadedConfig } from "../config/load-config.js";
import { parseStatsArgs } from "../handlers/stats.js";

const statsListener = (bot: Bot, config: LoadedConfig) => {
  bot.command("stats", async (ctx) => {
    const args = ctx.match;
    const result = parseStatsArgs(args, config.stats);

    await ctx.reply(result.message);
  });
};

export default statsListener;
