-- CreateEnum
CREATE TYPE "course_sequencing_mode" AS ENUM ('SEQUENTIAL', 'FLEXIBLE', 'HYBRID', 'INSTRUCTOR_CONTROLLED');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "sequencing_mode" "course_sequencing_mode" NOT NULL DEFAULT 'FLEXIBLE';

