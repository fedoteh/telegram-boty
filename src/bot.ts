import dotenv from "dotenv";
// verbatimModuleSyntax=true needs this to prevent unwanted side effects
dotenv.config();

import { Bot } from "grammy";
import { loadBotConfig } from "./config/load-config.js";
import { registerSquadCommands } from "./commands/register-squads.js";
import { registerListeners } from "./listeners/register-listeners.js";

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN is missing");
}

const bot = new Bot(token);
const config = loadBotConfig();

registerSquadCommands(bot, config.squads, config.defaults);
registerListeners(bot, config);

bot.start();
console.log("Bot started successfully 🤖, niru niru lcdtm");