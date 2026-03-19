import type { Bot } from "grammy";
import { getGroup, addMembers } from "../db/queries/game-groups.js";

/**
 * Generate a deterministic placeholder userId from a username.
 * Uses a simple hash that produces a negative BigInt so it never
 * collides with real Telegram user IDs (which are always positive).
 */
function usernameToPlaceholderId(username: string): bigint {
  let hash = 0;
  for (const char of username.toLowerCase()) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }
  return BigInt(Math.abs(hash)) * -1n - 1n; // always negative
}

/**
 * /add <groupName> @user1 @user2 ...
 *
 * Adds one or more users to an existing game group.
 * Anyone in the chat can add users.
 */
const addListener = (bot: Bot) => {
  bot.command("add", async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    const text = ctx.message?.text ?? "";
    // Everything after "/add "
    const argsRaw = text.replace(/^\/add(@\S+)?\s*/, "").trim();

    if (!argsRaw) {
      await ctx.reply(
        "Uso: `/add <grupo> @usuario1 @usuario2 ...`",
        { parse_mode: "Markdown" },
      );
      return;
    }

    // First word is the group name, rest are mentions
    const parts = argsRaw.split(/\s+/);
    const groupName = parts[0];

    if (!groupName) {
      await ctx.reply(
        "Tenés que especificar el nombre del grupo. Ejemplo: `/add dotita @user`",
        { parse_mode: "Markdown" },
      );
      return;
    }

    // Look up the group
    const group = await getGroup(BigInt(chatId), groupName);

    if (!group) {
      await ctx.reply(
        `No existe un grupo con el nombre *${groupName}* en este chat 🤷`,
        { parse_mode: "Markdown" },
      );
      return;
    }

    // Extract mentions from message entities
    const entities = ctx.message?.entities ?? [];
    const mentionEntities = entities.filter(
      (e) => e.type === "mention" || e.type === "text_mention",
    );

    if (mentionEntities.length === 0) {
      await ctx.reply(
        "Necesito que taggees al menos un usuario. Ejemplo: `/add dotita @user`",
        { parse_mode: "Markdown" },
      );
      return;
    }

    const usersToAdd: { userId: bigint; username?: string }[] = [];

    for (const entity of mentionEntities) {
      if (entity.type === "text_mention" && entity.user) {
        usersToAdd.push({
          userId: BigInt(entity.user.id),
          username: entity.user.username ?? entity.user.first_name,
        });
      } else if (entity.type === "mention") {
        const username = text
          .substring(entity.offset + 1, entity.offset + entity.length)
          .trim();
        if (username) {
          usersToAdd.push({
            userId: usernameToPlaceholderId(username),
            username,
          });
        }
      }
    }

    if (usersToAdd.length === 0) {
      await ctx.reply("No encontré ningún usuario para agregar 😕");
      return;
    }

    await addMembers(group.id, usersToAdd);

    const names = usersToAdd.map((u) => `@${u.username}`).join(", ");
    await ctx.reply(
      `✅ Agregué a ${names} al grupo *${groupName}*`,
      { parse_mode: "Markdown" },
    );
  });
};

export default addListener;
