import type { Bot } from "grammy";
import type { LoadedConfig } from "../config/load-config.js";
import { parseStatsArgs } from "../handlers/stats.js";
import { fetchDotaStats } from "../services/opendota.js";

const statsListener = (bot: Bot, config: LoadedConfig) => {
  bot.command("stats", async (ctx) => {
    const args = ctx.match;
    const result = parseStatsArgs(args, config.stats);

    if (!result.success || !result.platformId || !result.game) {
      await ctx.reply(result.message);
      return;
    }

    // Fetch real stats for supported games
    if (result.game === "dota") {
      await ctx.reply("🔄 A ver este govir, bancá...");
      const dotaStats = await fetchDotaStats(result.platformId);
      await ctx.reply(dotaStats.message, { parse_mode: "Markdown" });
      return;
    }

    // Fallback for games without API integration
    await ctx.reply(result.message);
  });
};

export default statsListener;
