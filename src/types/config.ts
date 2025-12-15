import type { SquadConfig } from "./squads.js";

export type CustomCommandReply = {
  part1: string;
  part2: string;
};

export type DefaultsConfig = {
  editedMessageReply?: string;
  customCommandReplies?: CustomCommandReply[];
};

export type BotConfig = {
  defaults: DefaultsConfig;
  squads: Record<string, SquadConfig>;
};
