import type { Bot } from "grammy";

type EditedMessageOptions = {
  replyText?: string;
};

const editedMessageListener = (bot: Bot, options: EditedMessageOptions = {}) => {
  const replyText = options.replyText?.trim();

  if (!replyText) {
    return;
  }

  bot.on("edited_message", async (ctx) => {
    const editedMessage = ctx.msg;

    // Skip media-only edits so the bot only reacts to text changes
    if (!editedMessage?.text) {
      return;
    }

    await ctx.reply(replyText, {
      reply_parameters: { message_id: editedMessage.message_id },
    });
  });
};

export default editedMessageListener;
