import type { Bot } from "grammy";
import { getGroup } from "../db/queries/game-groups.js";

/**
 * Dynamic game group command handler.
 *
 * When a user sends a command like /battlefield, /dotita, etc.,
 * this listener checks if a game group with that name exists
 * in the current chat and pings all members.
 *
 * This must be registered AFTER all other command listeners
 * so it doesn't intercept known commands like /create, /add, etc.
 */
const gameGroupCommandListener = (bot: Bot) => {
  bot.on("message:text", async (ctx, next) => {
    const text = ctx.message.text;

    // Only handle messages that look like a command (start with /)
    if (!text.startsWith("/")) {
      await next();
      return;
    }

    // Extract the command name (strip leading / and bot username suffix)
    const commandMatch = text.match(/^\/([a-zA-Z0-9_]+)(@\S+)?/);
    if (!commandMatch?.[1]) {
      await next();
      return;
    }

    const commandName = commandMatch[1].toLowerCase();
    const chatId = ctx.chat?.id;
    if (!chatId) {
      await next();
      return;
    }

    // Skip known built-in commands
    const builtInCommands = new Set([
      "create", "add", "rm", "delete", "list",
      "gta", "stats", "start", "help",
    ]);
    if (builtInCommands.has(commandName)) {
      await next();
      return;
    }

    // Check if a game group with this name exists
    const group = await getGroup(BigInt(chatId), commandName);

    if (!group) {
      // Not a game group command — pass to next middleware
      await next();
      return;
    }

    if (group.members.length === 0) {
      await ctx.reply(
        `El grupo *${group.name}* no tiene miembros todavía 😕\n\nAgregá gente con \`/add ${group.name} @user\``,
        { parse_mode: "Markdown" },
      );
      return;
    }

    // Ping all members
    const mentions = group.members
      .map((m) => m.username ? `@${m.username}` : `usuario #${m.userId}`)
      .join(", ");

    await ctx.reply(`🎮 *${group.displayName ?? group.name}*\n\nA jugar! ${mentions}`, {
      parse_mode: "Markdown",
    });
  });
};

export default gameGroupCommandListener;
