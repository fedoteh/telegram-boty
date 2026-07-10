import type { Context } from "grammy";

/**
 * Ensures the command was issued inside a Telegram group or supergroup chat.
 * Game group state is scoped per chat, so DMs and channels are rejected.
 *
 * Returns true if the chat is a group/supergroup. Otherwise replies to the
 * user with a short explanation and returns false — callers should bail out.
 */
export const ensureGroupChat = async (ctx: Context): Promise<boolean> => {
  const chatType = ctx.chat?.type;

  if (chatType === "group" || chatType === "supergroup") {
    return true;
  }

  await ctx.reply(
    "🚫 Este comando solo funciona en chats grupales. Agregame a un grupo y probá de nuevo!",
  );
  return false;
};
