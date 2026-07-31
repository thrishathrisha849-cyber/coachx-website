-- CreateEnum
CREATE TYPE "course_translation_status" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'REVIEW', 'APPROVED', 'PUBLISHED', 'OUTDATED');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "translation_status" "course_translation_status";
