-- AlterTable
ALTER TABLE "users" ADD COLUMN     "appointmentReminders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailUpdates" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentUpdates" BOOLEAN NOT NULL DEFAULT true;
