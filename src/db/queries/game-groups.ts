import prisma from "../client.js";

/**
 * Create a new game group in a Telegram chat.
 * The creator is automatically added as an admin member.
 */
export async function createGroup(
  chatId: bigint,
  name: string,
  gameLabel: string,
  createdBy: bigint,
  creatorUsername?: string,
) {
  return prisma.gameGroup.create({
    data: {
      chatId,
      name: name.toLowerCase(),
      displayName: name,
      gameLabel,
      createdBy,
      members: {
        create: {
          userId: createdBy,
          username: creatorUsername ?? null,
          role: "admin",
        },
      },
    },
    include: { members: true },
  });
}

/**
 * Find a game group by chat ID and name (case-insensitive slug).
 */
export async function getGroup(chatId: bigint, name: string) {
  return prisma.gameGroup.findUnique({
    where: {
      chatId_name: { chatId, name: name.toLowerCase() },
    },
    include: { members: true },
  });
}

/**
 * List all game groups for a given Telegram chat.
 */
export async function listGroups(chatId: bigint) {
  return prisma.gameGroup.findMany({
    where: { chatId },
    include: { members: true },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Add one or more members to an existing game group.
 * Silently skips users that are already members (upsert).
 */
export async function addMembers(
  groupId: number,
  users: { userId: bigint; username?: string }[],
) {
  const operations = users.map((u) =>
    prisma.gameGroupMember.upsert({
      where: {
        groupId_userId: { groupId, userId: u.userId },
      },
      update: {
        username: u.username ?? null,
      },
      create: {
        groupId,
        userId: u.userId,
        username: u.username ?? null,
        role: "member",
      },
    }),
  );

  return prisma.$transaction(operations);
}

/**
 * Remove a member from a game group.
 * Returns the deleted record, or null if the member was not found.
 */
export async function removeMember(groupId: number, userId: bigint) {
  try {
    return await prisma.gameGroupMember.delete({
      where: {
        groupId_userId: { groupId, userId },
      },
    });
  } catch {
    // Record not found — nothing to delete
    return null;
  }
}

/**
 * Check whether a given user is an admin of a specific game group.
 */
export async function isGroupAdmin(groupId: number, userId: bigint) {
  const member = await prisma.gameGroupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
    select: { role: true },
  });

  return member?.role === "admin";
}
