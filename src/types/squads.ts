export type SquadMember = {
  handle: string;
};

export type SquadConfig = {
  label: string;
  customFunNames: string[];
  members: SquadMember[];
};
