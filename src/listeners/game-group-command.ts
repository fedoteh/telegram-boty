import type { Bot } from "grammy";
import { getGroup } from "../db/queries/game-groups.js";

/**
 * Dynamic game group command handler.
 *
 * When a user sends a command like /battlefield, /dotita, etc.,
 * this listener checks if a game group with that name exists
 * in the current chat and pings all members.
 *
 * Supports `/<group> help` to show usage for that specific group.
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
      "gta", "stats", "start", "help", "boty",
    ]);
    if (builtInCommands.has(commandName)) {
      await next();
      return;
    }

    // Game groups only exist in group chats — in DMs, let the message
    // fall through to other middleware (there's nothing to summon).
    const chatType = ctx.chat?.type;
    if (chatType !== "group" && chatType !== "supergroup") {
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

    // Parse args after the command
    const args = text
      .replace(/^\/[a-zA-Z0-9_]+(@\S+)?\s*/, "")
      .trim()
      .toLowerCase();

    if (args === "help") {
      const displayName = group.displayName ?? group.name;
      const helpMessage =
        `🎮 <b>${displayName}</b> — cómo se usa\n\n` +
        `• <code>/${group.name}</code> — convoca a todos los miembros del grupo\n` +
        `• <code>/${group.name} help</code> — muestra este mensaje\n\n` +
        `<b>Administrar el grupo:</b>\n` +
        `• <code>/add ${group.name} @user1 @user2</code> — agregar miembros\n` +
        `• <code>/rm ${group.name} me</code> — salir del grupo\n` +
        `• <code>/rm ${group.name} @user</code> — sacar a alguien (solo admin)\n` +
        `• <code>/delete ${group.name}</code> — eliminar el grupo (solo admin)\n\n` +
        `Escribí <code>/boty help</code> para ver todos los comandos disponibles.`;

      await ctx.reply(helpMessage, { parse_mode: "HTML" });
      return;
    }

    if (group.members.length === 0) {
      await ctx.reply(
        `El grupo <b>${group.name}</b> no tiene miembros todavía 😕\n\nAgregá gente con <code>/add ${group.name} @user</code>`,
        { parse_mode: "HTML" },
      );
      return;
    }

    // Ping all members
    const mentions = group.members
      .map((m) => m.username ? `@${m.username}` : `usuario #${m.userId}`)
      .join(", ");

    await ctx.reply(`🎮 <b>${group.displayName ?? group.name}</b>\n\nA jugar! ${mentions}`, {
      parse_mode: "HTML",
    });
  });
};

export default gameGroupCommandListener;

