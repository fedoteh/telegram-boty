-- CreateTable
CREATE TABLE "game_groups" (
    "id" SERIAL NOT NULL,
    "chatId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "gameLabel" TEXT NOT NULL,
    "createdBy" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_group_members" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "userId" BIGINT NOT NULL,
    "username" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_groups_chatId_name_key" ON "game_groups"("chatId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "game_group_members_groupId_userId_key" ON "game_group_members"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "game_group_members" ADD CONSTRAINT "game_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "game_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
