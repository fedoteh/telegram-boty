import type { Bot } from "grammy";

const RELEASE_DATE = "2026-11-19";

const gtaListener = (bot: Bot) => {
  bot.command("gta", async (ctx) => {
    const releaseDate = new Date(RELEASE_DATE);
    const diffDays = Math.ceil((releaseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const cosmeticDate = `${releaseDate.getUTCDate()} de ${months[releaseDate.getUTCMonth()]} de ${releaseDate.getUTCFullYear()}`;

    const replyMsg = `📅 Faltan *${diffDays}* días para el lanzamiento de GTA VI!\n\nFecha de lanzamiento: *${cosmeticDate}*\nQué manija lcdtm, comprate la Play 5 antes que suba 💸 bubuuu`;
    return await ctx.reply(replyMsg, { parse_mode: "Markdown" });
  });
};

export default gtaListener;
    