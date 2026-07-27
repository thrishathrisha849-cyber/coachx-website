-- Phase 6 Part 1 CORRECTION — align Course.status with 004/spec.md
-- FR-015/FR-100, and fold the separate `visibility` column into `status`
-- (see docs/lms/COURSE_LIFECYCLE.md and docs/lms/DECISION_GATES.md for the
-- full rationale). This migration is written as a NEW, additive-and-
-- corrective migration rather than an edit to the already-generated
-- `20260727115732_add_lms_course_foundation` migration, per the project's
-- established "never edit a prior migration" discipline — even though no
-- environment in this sandbox has actually applied that migration yet
-- (no reachable Postgres instance anywhere in this project to date).
--
-- DATA-MIGRATION MAPPING (every renamed/removed lifecycle state, applied
-- deterministically below via an explicit CASE expression — NOT a blind
-- `::text::newenum` cast, which would fail outright on any row still
-- carrying a value the new enum no longer defines, e.g. the old `REVIEW`
-- or `UNPUBLISHED` values):
--
--   old status='DRAFT'                                  -> 'DRAFT'
--   old status='REVIEW'                                 -> 'SUBMITTED_FOR_REVIEW'
--   old status='APPROVED'                                -> 'APPROVED'
--   old status='SCHEDULED'                                -> 'SCHEDULED'
--   old status='PUBLISHED' AND old visibility='UNLISTED' -> 'UNLISTED'      (visibility folded into status)
--   old status='PUBLISHED' AND old visibility='PUBLIC'   -> 'PUBLISHED'
--   old status='UNPUBLISHED'                              -> 'ARCHIVED'      (closest FR-015 semantic: pulled back from
--                                                                             public without deletion; FR-015 names no
--                                                                             "Unpublished" state at all — see
--                                                                             docs/lms/DECISION_GATES.md)
--   old status='ARCHIVED'                                -> 'ARCHIVED'
--
-- New states with no prior data to map (never existed before this
-- correction): CHANGES_REQUESTED, ENROLLMENT_PAUSED, RETIRED.

-- CreateEnum
CREATE TYPE "module_release_rule_type" AS ENUM ('IMMEDIATE', 'DAYS_AFTER_ENROLLMENT', 'FIXED_DATE', 'AFTER_PREVIOUS_MODULE', 'INSTRUCTOR_RELEASE');

-- CreateEnum
CREATE TYPE "module_completion_rule_type" AS ENUM ('MANUAL', 'INSTRUCTOR_APPROVAL');

-- AlterEnum: rebuild course_status with the FR-015/FR-100-aligned value set,
-- mapping every existing row deterministically (see mapping table above).
BEGIN;
CREATE TYPE "course_status_new" AS ENUM ('DRAFT', 'SUBMITTED_FOR_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'UNLISTED', 'ENROLLMENT_PAUSED', 'ARCHIVED', 'RETIRED');

ALTER TABLE "courses" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "courses" ALTER COLUMN "status" TYPE "course_status_new" USING (
  CASE "status"::text
    WHEN 'DRAFT' THEN 'DRAFT'
    WHEN 'REVIEW' THEN 'SUBMITTED_FOR_REVIEW'
    WHEN 'APPROVED' THEN 'APPROVED'
    WHEN 'SCHEDULED' THEN 'SCHEDULED'
    WHEN 'PUBLISHED' THEN
      CASE "visibility"::text
        WHEN 'UNLISTED' THEN 'UNLISTED'
        ELSE 'PUBLISHED'
      END
    WHEN 'UNPUBLISHED' THEN 'ARCHIVED'
    WHEN 'ARCHIVED' THEN 'ARCHIVED'
    ELSE 'DRAFT' -- defensive fallback; every real prior value is covered above
  END::"course_status_new"
);

ALTER TYPE "course_status" RENAME TO "course_status_old";
ALTER TYPE "course_status_new" RENAME TO "course_status";
DROP TYPE "course_status_old";
ALTER TABLE "courses" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropIndex (superseded by the single-column index below — `visibility` no
-- longer exists as a separate dimension).
DROP INDEX "courses_status_visibility_idx";

-- Now that `status` has fully absorbed `visibility`'s meaning for every
-- existing row, the column itself can be dropped safely.
ALTER TABLE "courses" DROP COLUMN "visibility";

-- AlterTable: new FR-014 catalog fields on Course.
ALTER TABLE "courses"
  ADD COLUMN "certificate_available" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "learner_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "learning_outcomes" TEXT[],
  ADD COLUMN "published_by" UUID,
  ADD COLUMN "rating_average" DOUBLE PRECISION,
  ADD COLUMN "rating_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "review_notes" TEXT,
  ADD COLUMN "reviewed_by" UUID,
  ADD COLUMN "tags" TEXT[],
  ADD COLUMN "target_audience" TEXT,
  ADD COLUMN "tools_required" TEXT[],
  ADD COLUMN "weekly_commitment_minutes" INTEGER;

-- AlterTable: new FR-016 module fields (configuration-only — see schema.prisma doc comment).
ALTER TABLE "course_modules"
  ADD COLUMN "completion_rule_type" "module_completion_rule_type" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "estimated_duration_minutes" INTEGER,
  ADD COLUMN "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "outcome" TEXT,
  ADD COLUMN "prerequisite_module_id" UUID,
  ADD COLUMN "release_rule_type" "module_release_rule_type" NOT NULL DEFAULT 'IMMEDIATE',
  ADD COLUMN "release_rule_value" JSONB;

-- DropEnum: `visibility` as a second dimension no longer exists.
DROP TYPE "course_visibility";

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "courses"("status");

-- CreateIndex
CREATE INDEX "course_modules_prerequisite_module_id_idx" ON "course_modules"("prerequisite_module_id");

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_prerequisite_module_id_fkey" FOREIGN KEY ("prerequisite_module_id") REFERENCES "course_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
