-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'accountant', 'employee');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'employee';
