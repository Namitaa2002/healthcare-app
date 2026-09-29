-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "attachmentName" TEXT,
ADD COLUMN     "attachmentSize" INTEGER,
ADD COLUMN     "attachmentType" TEXT,
ADD COLUMN     "attachmentUrl" TEXT,
ADD COLUMN     "messageType" TEXT NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "content" DROP NOT NULL;
