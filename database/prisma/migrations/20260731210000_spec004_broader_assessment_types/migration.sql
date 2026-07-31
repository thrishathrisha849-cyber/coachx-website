-- CreateEnum
CREATE TYPE "assessment_type" AS ENUM ('STANDARD', 'SELF_ASSESSMENT', 'SKILL_RATING', 'SCENARIO_TASK', 'PORTFOLIO_REVIEW');

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "assessment_type" "assessment_type" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "is_self_assessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "outcome_level" VARCHAR(20);
