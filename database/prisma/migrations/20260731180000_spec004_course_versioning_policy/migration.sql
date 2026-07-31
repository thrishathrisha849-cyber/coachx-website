-- CreateEnum
CREATE TYPE "course_version_existing_learner_policy" AS ENUM ('CONTINUE_CURRENT_VERSION', 'OPTIONAL_MIGRATION', 'MANDATORY_MIGRATION');

-- AlterTable
ALTER TABLE "course_versions" ADD COLUMN     "change_summary" TEXT,
ADD COLUMN     "effective_date" TIMESTAMPTZ(6),
ADD COLUMN     "existing_learner_policy" "course_version_existing_learner_policy" NOT NULL DEFAULT 'CONTINUE_CURRENT_VERSION';

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "migrated_to_version_number" INTEGER;
