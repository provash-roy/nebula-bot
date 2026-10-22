-- CreateEnum
CREATE TYPE "ChatKind" AS ENUM ('direct', 'group');

-- CreateTable
CREATE TABLE "chats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ChatKind" NOT NULL DEFAULT 'direct',
    "name" TEXT,
    "lastMessagePreview" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatMembers" (
    "chatId" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatMembers_pkey" PRIMARY KEY ("chatId","botId")
);

-- CreateIndex
CREATE INDEX "chats_userId_idx" ON "chats"("userId");

-- CreateIndex
CREATE INDEX "chatMembers_botId_idx" ON "chatMembers"("botId");

-- AddForeignKey
ALTER TABLE "chatMembers" ADD CONSTRAINT "chatMembers_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatMembers" ADD CONSTRAINT "chatMembers_botId_fkey" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
