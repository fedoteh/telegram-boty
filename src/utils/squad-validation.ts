import type { SquadConfig, SquadMember } from "../types/squads.js";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isValidSquadMember = (candidate: unknown): candidate is SquadMember => {
  if (!isPlainObject(candidate)) {
    return false;
  }

  if (typeof candidate.handle !== "string") {
    return false;
  }

  const trimmedHandle = candidate.handle.trim();
  const handleLooksValid = trimmedHandle.startsWith("@") && trimmedHandle.length > 1;

  return handleLooksValid;
};

const isValidSquadConfig = (candidate: unknown): candidate is SquadConfig => {
  if (!isPlainObject(candidate)) {
    return false;
  }

  if (
    typeof candidate.label !== "string" ||
    !Array.isArray(candidate.customFunNames) ||
    !candidate.customFunNames.every((name) => typeof name === "string") ||
    !Array.isArray(candidate.members)
  ) {
    return false;
  }

  return candidate.members.every(isValidSquadMember);
};

export const buildSquadMap = (raw: unknown): Record<string, SquadConfig> => {
  if (!isPlainObject(raw)) {
    console.warn("Squad config root is invalid. No squad commands registered.");
    return {};
  }

  return Object.entries(raw).reduce<Record<string, SquadConfig>>((acc, [command, config]) => {
    if (isValidSquadConfig(config)) {
      const members = config.members.map((member) => ({ handle: member.handle.trim() }));
      const customFunNames = config.customFunNames.map((name) => name.trim()).filter(Boolean);
      acc[command] = { label: config.label, customFunNames, members };
    } else {
      console.warn(`Skipping squad command "${command}" due to invalid structure.`);
    }

    return acc;
  }, {});
};
