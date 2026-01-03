import type { Bot } from "grammy";
import type { SquadConfig } from "../types/squads.js";
import type { DefaultsConfig, CustomCommandReply } from "../types/config.js";

const pickRandom = <T>(items?: T[]): T | undefined => {
  if (!items?.length) {
    return undefined;
  }

  const index = Math.floor(Math.random() * items.length);
  return items[index];
};

const formatReply = (
  reply: CustomCommandReply | undefined,
  gameName: string,
  mentions: string,
  snoozeSettings?: DefaultsConfig["snoozeSettings"],
): string => {
  if (!reply) {
    return `Miembros configurados para ${gameName}: ${mentions}`;
  }
  const currentHour = new Date().getHours();

  if (snoozeSettings !== undefined && currentHour >= snoozeSettings.snoozeHourRange[0] && currentHour <= snoozeSettings.snoozeHourRange[1]){
    return pickRandom(snoozeSettings.snoozeCustomResponses) ?? "Andá a dormir! 🤣";
  }
  return `${reply.part1} ${gameName} ${mentions} ${reply.part2}?`;
};

export const registerSquadCommands = (
  bot: Bot,
  squads: Record<string, SquadConfig>,
  defaults: DefaultsConfig,
) => {
  const entries = Object.entries(squads) as Array<[string, SquadConfig]>;

  if (!entries.length) {
    console.warn("Wrong squad config on bot-config.json; no squad commands registered.");
    return;
  }

  entries.forEach(([command, squad]) => {
    bot.command(command, async (ctx) => {
      if (!squad.members.length) {
        await ctx.reply(`Todavía no configuraste ningún miembro de ${squad.label}.`);
        return;
      }

      const mentions = squad.members.map((member) => member.handle.trim()).join(", ");
      const customGameName = pickRandom(squad.customFunNames) ?? squad.label;
      const customReply = pickRandom(defaults.customCommandReplies);

      await ctx.reply(formatReply(customReply, customGameName, mentions, defaults.snoozeSettings) );
    });
  });
};
