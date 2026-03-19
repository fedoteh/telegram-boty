import type { Bot } from "grammy";
import { getGroup, isGroupAdmin, deleteGroup } from "../db/queries/game-groups.js";

/**
 * /delete <groupName>
 *
 * Deletes a game group. Only the group admin (creator) can do this.
 */
const deleteListener = (bot: Bot) => {
  bot.command("delete", async (ctx) => {
    const chatId = ctx.chat?.id;
    const callerId = ctx.from?.id;
    if (!chatId || !callerId) return;

    const groupName = ctx.match?.trim() ?? "";

    if (!groupName) {
      await ctx.reply(
        "Tenés que especificar el grupo. Ejemplo: `/delete battlefield`",
        { parse_mode: "Markdown" },
      );
      return;
    }

    const group = await getGroup(BigInt(chatId), groupName);

    if (!group) {
      await ctx.reply(
        `No existe un grupo con el nombre *${groupName}* en este chat 🤷`,
        { parse_mode: "Markdown" },
      );
      return;
    }

    const callerIsAdmin = await isGroupAdmin(group.id, BigInt(callerId));

    if (!callerIsAdmin) {
      await ctx.reply("Solo el admin del grupo puede borrarlo ⛔");
      return;
    }

    await deleteGroup(group.id);

    await ctx.reply(
      `🗑️ Grupo *${groupName}* eliminado.`,
      { parse_mode: "Markdown" },
    );
  });
};

export default deleteListener;
