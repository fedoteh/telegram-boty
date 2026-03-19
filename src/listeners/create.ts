import type { Bot } from "grammy";
import { createGroup, getGroup } from "../db/queries/game-groups.js";

/**
 * /create <groupName>
 *
 * Creates a new game group in the current chat.
 * The creator becomes the group admin.
 */
const createListener = (bot: Bot) => {
  bot.command("create", async (ctx) => {
    const chatId = ctx.chat?.id;
    const creatorId = ctx.from?.id;
    const creatorUsername = ctx.from?.username;

    if (!chatId || !creatorId) return;

    const groupName = ctx.match?.trim() ?? "";

    if (!groupName) {
      await ctx.reply(
        "Tenés que darle un nombre al grupo. Ejemplo: `/create battlefield`",
        { parse_mode: "Markdown" },
      );
      return;
    }

    // Check if the group already exists
    const existing = await getGroup(BigInt(chatId), groupName);

    if (existing) {
      await ctx.reply(
        `Ya existe un grupo con el nombre *${groupName}* en este chat 🤷`,
        { parse_mode: "Markdown" },
      );
      return;
    }

    await createGroup(
      BigInt(chatId),
      groupName,
      groupName, // gameLabel = groupName
      BigInt(creatorId),
      creatorUsername,
    );

    await ctx.reply(
      `✅ Grupo *${groupName}* creado!\n\nUsá \`/add ${groupName} @user1 @user2\` para agregar usuarios.`,
      { parse_mode: "Markdown" },
    );
  });
};

export default createListener;
