import dotenv from "dotenv";
// verbatimModuleSyntax=true needs this to prevent unwanted side effects
dotenv.config(); 

import { Bot } from "grammy";

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN is missing");
}
