import type { Bot } from "grammy";

const HELP_MESSAGE =
  "🤖 <b>Boty — comandos disponibles</b>\n\n" +
  "<b>Game groups</b>\n" +
  "• <code>/create &lt;grupo&gt;</code> — crear un nuevo grupo (el creador queda como admin)\n" +
  "• <code>/list</code> — listar los grupos de este chat\n" +
  "• <code>/add &lt;grupo&gt; @user1 @user2</code> — agregar miembros\n" +
  "• <code>/rm &lt;grupo&gt; me</code> — salir del grupo\n" +
  "• <code>/rm &lt;grupo&gt; @user</code> — sacar a alguien (solo admin)\n" +
  "• <code>/delete &lt;grupo&gt;</code> — eliminar el grupo (solo admin)\n" +
  "• <code>/&lt;grupo&gt;</code> — convocar a todos los miembros (ej: <code>/dotita</code>)\n" +
  "• <code>/&lt;grupo&gt; help</code> — ver ayuda específica del grupo\n\n" +
  "<b>Stats</b>\n" +
  "• <code>/stats &lt;juego&gt; &lt;usuario&gt;</code> — obtener stats de un jugador\n" +
  "• <code>/stats help</code> — ver juegos y jugadores configurados\n\n" +
  "<b>Otros</b>\n" +
  "• <code>/gta</code> — random GTA fun\n" +
  "• <code>/boty help</code> — mostrar este mensaje";

/**
 * /boty help — top-level help command.
 * Also responds to bare /boty by showing the same help.
 */
const botyListener = (bot: Bot) => {
  bot.command("boty", async (ctx) => {
    await ctx.reply(HELP_MESSAGE, { parse_mode: "HTML" });
  });
};

export default botyListener;
