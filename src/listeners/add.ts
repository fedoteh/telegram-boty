import type { Bot } from "grammy";
import { getGroup, addMembers } from "../db/queries/game-groups.js";
import { ensureGroupChat } from "../utils/chat-type.js";

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
    if (!(await ensureGroupChat(ctx))) return;

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
    const callerId = ctx.from?.id;
    const callerUsername = ctx.from?.username;

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
        if (!username) continue;

        // If the caller is tagging themselves, use their real Telegram userId
        // instead of a placeholder — otherwise we'd create a phantom row.
        if (
          callerId !== undefined &&
          callerUsername &&
          username.toLowerCase() === callerUsername.toLowerCase()
        ) {
          usersToAdd.push({ userId: BigInt(callerId), username });
        } else {
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

    const results = await addMembers(group.id, usersToAdd);

    const addedOrReconciled = results.filter(
      (r) => r.status === "added" || r.status === "reconciled",
    );
    const duplicates = results.filter((r) => r.status === "duplicate");

    const lines: string[] = [];

    if (addedOrReconciled.length > 0) {
      const names = addedOrReconciled
        .map((r) => `@${r.username ?? "?"}`)
        .join(", ");
      lines.push(`✅ Agregué a ${names} al grupo *${groupName}*`);
    }

    if (duplicates.length > 0) {
      const names = duplicates.map((r) => `@${r.username ?? "?"}`).join(", ");
      lines.push(`ℹ️ Ya estaban en *${groupName}*: ${names}`);
    }

    await ctx.reply(lines.join("\n") || "No hice ningún cambio 🤔", {
      parse_mode: "Markdown",
    });
  });
};

export default addListener;
