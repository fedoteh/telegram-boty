import type { SquadConfig } from "./squads.js";

export type CustomCommandReply = {
  part1: string;
  part2: string;
};

export type DefaultsConfig = {
  editedMessageReply?: string;
  customCommandReplies?: CustomCommandReply[];
  snoozeSettings?: {
    snoozeHourRange: [number, number];
    snoozeCustomResponses?: string[];
  };
};

export type BotConfig = {
  defaults: DefaultsConfig;
  squads: Record<string, SquadConfig>;
};
