import type { Bot } from "grammy";
import { getGroup, removeMember, isGroupAdmin } from "../db/queries/game-groups.js";

/**
 * /rm <groupName> me        — remove yourself from a group
 * /rm <groupName> @user     — remove another user (admin only)
 */
const rmListener = (bot: Bot) => {
  bot.command("rm", async (ctx) => {
    const chatId = ctx.chat?.id;
    const callerId = ctx.from?.id;
    if (!chatId || !callerId) return;

    const text = ctx.message?.text ?? "";
    // Everything after "/rm "
    const argsRaw = text.replace(/^\/rm(@\S+)?\s*/, "").trim();

    if (!argsRaw) {
      await ctx.reply(
        "Uso:\n`/rm <grupo> me` — salir del grupo\n`/rm <grupo> @usuario` — sacar a alguien (solo admin)",
        { parse_mode: "Markdown" },
      );
      return;
    }

    const parts = argsRaw.split(/\s+/);
    const groupName = parts[0];
    const target = parts.slice(1).join(" ").trim();

    if (!groupName || !target) {
      await ctx.reply(
        "Tenés que especificar el grupo y a quién sacar. Ejemplo:\n`/rm dotita me`\n`/rm dotita @user`",
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

    // Case 1: "/rm <group> me" — remove yourself
    if (target.toLowerCase() === "me") {
      const callerIsAdmin = await isGroupAdmin(group.id, BigInt(callerId));

      if (callerIsAdmin) {
        await ctx.reply(
          `No podés salir del grupo *${groupName}* porque sos el admin 👑\n\nSi querés eliminarlo usá \`/delete ${groupName}\``,
          { parse_mode: "Markdown" },
        );
        return;
      }

      const removed = await removeMember(group.id, BigInt(callerId));

      if (removed) {
        await ctx.reply(
          `✅ Te saqué del grupo *${groupName}*. Chau! 👋`,
          { parse_mode: "Markdown" },
        );
      } else {
        await ctx.reply(
          `No estás en el grupo *${groupName}* 🤔`,
          { parse_mode: "Markdown" },
        );
      }
      return;
    }

    // Case 2: "/rm <group> @user" — admin removes someone else
    const callerIsAdmin = await isGroupAdmin(group.id, BigInt(callerId));

    if (!callerIsAdmin) {
      await ctx.reply(
        "Solo los admins del grupo pueden sacar a otros usuarios ⛔",
      );
      return;
    }

    // Extract the target user from entities
    const entities = ctx.message?.entities ?? [];
    // Find mention entities that are NOT the /rm command itself
    const mentionEntities = entities.filter(
      (e) => e.type === "mention" || e.type === "text_mention",
    );

    if (mentionEntities.length === 0) {
      await ctx.reply(
        "Tenés que taggear al usuario que querés sacar. Ejemplo: `/rm dotita @user`",
        { parse_mode: "Markdown" },
      );
      return;
    }

    const results: string[] = [];

    for (const entity of mentionEntities) {
      if (entity.type === "text_mention" && entity.user) {
        const removed = await removeMember(group.id, BigInt(entity.user.id));
        const name = entity.user.username ?? entity.user.first_name;
        if (removed) {
          results.push(`✅ Saqué a @${name} del grupo *${groupName}*`);
        } else {
          results.push(`@${name} no está en el grupo *${groupName}*`);
        }
      } else if (entity.type === "mention") {
        const username = text
          .substring(entity.offset + 1, entity.offset + entity.length)
          .trim();
        // For plain @mentions, try to find the member by username
        const member = group.members.find(
          (m) => m.username?.toLowerCase() === username.toLowerCase(),
        );

        if (member) {
          const removed = await removeMember(group.id, member.userId);
          if (removed) {
            results.push(`✅ Saqué a @${username} del grupo *${groupName}*`);
          } else {
            results.push(`@${username} no está en el grupo *${groupName}*`);
          }
        } else {
          results.push(
            `⚠️ No encontré a @${username} en el grupo *${groupName}*`,
          );
        }
      }
    }

    if (results.length > 0) {
      await ctx.reply(results.join("\n"), { parse_mode: "Markdown" });
    } else {
      await ctx.reply("No encontré ningún usuario para sacar 😕");
    }
  });
};

export default rmListener;
