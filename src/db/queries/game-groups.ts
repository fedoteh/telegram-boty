import { getPrisma } from "../client.js";

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
  return getPrisma().gameGroup.create({
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
  return getPrisma().gameGroup.findUnique({
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
  return getPrisma().gameGroup.findMany({
    where: { chatId },
    include: { members: true },
    orderBy: { createdAt: "asc" },
  });
}

export type AddMemberResult =
  | { status: "added"; userId: bigint; username: string | null }
  | { status: "duplicate"; userId: bigint; username: string | null }
  | { status: "reconciled"; oldUserId: bigint; newUserId: bigint; username: string | null; role: string };

/**
 * Add one or more members to an existing game group.
 *
 * Dedup rules (in order of precedence):
 *   1. If a member with the same lowercase username already exists in the
 *      group, do NOT create a duplicate row.
 *   2. If that existing member is a placeholder (negative userId) and the new
 *      user has a real userId, reconcile: replace the placeholder record with
 *      the real userId while preserving the existing role. This lets a real
 *      Telegram user "claim" a placeholder that was created when the bot
 *      couldn't resolve their @handle.
 *   3. Otherwise fall back to upserting by (groupId, userId).
 */
export async function addMembers(
  groupId: number,
  users: { userId: bigint; username?: string }[],
): Promise<AddMemberResult[]> {
  const prisma = getPrisma();

  const existing = await prisma.gameGroupMember.findMany({
    where: { groupId },
    select: { userId: true, username: true, role: true },
  });

  const byLowerUsername = new Map<string, { userId: bigint; role: string }>();
  for (const m of existing) {
    if (m.username) {
      byLowerUsername.set(m.username.toLowerCase(), { userId: m.userId, role: m.role });
    }
  }

  const results: AddMemberResult[] = [];

  for (const u of users) {
    const usernameLower = u.username?.toLowerCase();
    const collision = usernameLower ? byLowerUsername.get(usernameLower) : undefined;

    if (collision) {
      const existingIsPlaceholder = collision.userId < 0n;
      const newIsReal = u.userId > 0n;
      const sameId = collision.userId === u.userId;

      if (sameId) {
        results.push({ status: "duplicate", userId: u.userId, username: u.username ?? null });
        continue;
      }

      if (existingIsPlaceholder && newIsReal) {
        // Reconcile: swap placeholder record for real user, keep role.
        await prisma.$transaction([
          prisma.gameGroupMember.delete({
            where: { groupId_userId: { groupId, userId: collision.userId } },
          }),
          prisma.gameGroupMember.create({
            data: {
              groupId,
              userId: u.userId,
              username: u.username ?? null,
              role: collision.role,
            },
          }),
        ]);
        byLowerUsername.set(usernameLower!, { userId: u.userId, role: collision.role });
        results.push({
          status: "reconciled",
          oldUserId: collision.userId,
          newUserId: u.userId,
          username: u.username ?? null,
          role: collision.role,
        });
        continue;
      }

      // Different userIds but same username, and we can't safely reconcile
      // (e.g. two placeholders or existing real vs. new placeholder). Skip.
      results.push({ status: "duplicate", userId: u.userId, username: u.username ?? null });
      continue;
    }

    await prisma.gameGroupMember.upsert({
      where: { groupId_userId: { groupId, userId: u.userId } },
      update: {
        ...(u.username ? { username: u.username } : {}),
      },
      create: {
        groupId,
        userId: u.userId,
        username: u.username ?? null,
        role: "member",
      },
    });

    if (usernameLower) {
      byLowerUsername.set(usernameLower, { userId: u.userId, role: "member" });
    }
    results.push({ status: "added", userId: u.userId, username: u.username ?? null });
  }

  return results;
}

/**
 * Remove a member from a game group.
 * Returns the deleted record, or null if the member was not found.
 */
export async function removeMember(groupId: number, userId: bigint) {
  try {
    return await getPrisma().gameGroupMember.delete({
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
  const member = await getPrisma().gameGroupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
    select: { role: true },
  });

  return member?.role === "admin";
}

/**
 * Remove a member from a group, transferring admin to the oldest remaining
 * member if the departing user was the admin. If they were the only member,
 * the group itself is deleted. Returns a summary of what happened.
 */
export async function removeMemberWithSuccession(
  groupId: number,
  userId: bigint,
): Promise<
  | { removed: false }
  | { removed: true; wasAdmin: boolean; groupDeleted: boolean; newAdmin?: { userId: bigint; username: string | null } }
> {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const member = await tx.gameGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { role: true },
    });

    if (!member) return { removed: false } as const;

    await tx.gameGroupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });

    const wasAdmin = member.role === "admin";

    if (!wasAdmin) {
      return { removed: true, wasAdmin: false, groupDeleted: false } as const;
    }

    // Departing user was the admin — pick a successor or delete the group.
    const successor = await tx.gameGroupMember.findFirst({
      where: { groupId },
      orderBy: { addedAt: "asc" },
      select: { userId: true, username: true },
    });

    if (!successor) {
      await tx.gameGroup.delete({ where: { id: groupId } });
      return { removed: true, wasAdmin: true, groupDeleted: true } as const;
    }

    await tx.gameGroupMember.update({
      where: { groupId_userId: { groupId, userId: successor.userId } },
      data: { role: "admin" },
    });

    return {
      removed: true,
      wasAdmin: true,
      groupDeleted: false,
      newAdmin: successor,
    } as const;
  });
}

/**
 * Delete a game group and all its members (cascade).
 */
export async function deleteGroup(groupId: number) {
  return getPrisma().gameGroup.delete({
    where: { id: groupId },
  });
}
