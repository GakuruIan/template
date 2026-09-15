/*
  Warnings:

  - You are about to drop the column `branchId` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the `branches` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_branchId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_branchId_fkey";

-- DropIndex
DROP INDEX "invitations_branchId_idx";

-- AlterTable
ALTER TABLE "invitations" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "branchId";

-- DropTable
DROP TABLE "branches";
