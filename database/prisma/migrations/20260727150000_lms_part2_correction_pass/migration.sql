-- Phase 6 Part 2 — Mandatory Correction and Verification Pass.
-- Purely ADDITIVE, on top of `20260727140000_add_lms_lessons_activities_
-- enrollment_progress` (which is preserved unchanged — this is a NEW
-- migration, never an edit to a prior one, per this repository's
-- established discipline).
--
-- Two changes, both correcting real design defects found during the
-- correction pass:
--
-- 1. `lessons.completion_rule_types` (new, nullable, array-of-enum,
--    defaults to an empty array at both the DB and Prisma-client level) —
--    FR-052 explicitly states "MUST allow a single lesson to combine
--    multiple required conditions." The original Part 2 design only
--    stored a single `completion_rule_type` column, which could not
--    express that. This new column is the authoritative multi-condition
--    set when non-empty; the original singular column is UNCHANGED and
--    remains the fallback for any existing row (or any row a caller
--    creates without supplying the new field) — no existing data is
--    altered, dropped, or reinterpreted by this migration.
--
-- 2. `activity_progress` (new table) — real, server-derived tracking of
--    "has this enrollment viewed this specific learning activity,"
--    replacing the corrected defect where `ALL_ACTIVITIES_VIEWED` was
--    silently evaluated as an alias of `MANUAL` (see
--    docs/lms/COMPLETION_ENGINE.md for the full before/after).
--
-- Generated via the same offline `prisma migrate diff --script` workflow
-- every migration in this repository uses (no live Postgres reachable in
-- this sandbox), then hand-reviewed. No hand-added SQL beyond what the
-- diff tool produced was necessary this time — both changes are simple
-- additive column/table creations with no partial-index or
-- data-backfill nuance (unlike Part 1's course_status enum rename or the
-- enrollment partial-unique-index, neither of which this migration
-- touches).

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "completion_rule_types" "lesson_completion_rule_type"[] DEFAULT ARRAY[]::"lesson_completion_rule_type"[];

-- CreateTable
CREATE TABLE "activity_progress" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "viewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "activity_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_progress_enrollment_id_lesson_id_idx" ON "activity_progress"("enrollment_id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_progress_enrollment_id_activity_id_key" ON "activity_progress"("enrollment_id", "activity_id");

-- AddForeignKey
ALTER TABLE "activity_progress" ADD CONSTRAINT "activity_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_progress" ADD CONSTRAINT "activity_progress_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "learning_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- NOTE — partial unique index review (Correction pass, "Migration Review"
-- section): the existing partial unique index
-- `enrollments_one_active_per_user_course` (defined in the PRIOR Part 2
-- migration, `20260727140000_...`) was re-reviewed against the full
-- EnrollmentStatus lifecycle (PENDING/ACTIVE/SUSPENDED/EXPIRED/CANCELLED/
-- COMPLETED/REVOKED) and found to be CORRECT as originally written — its
-- WHERE clause (`status IN ('PENDING','ACTIVE','SUSPENDED')`) is the
-- right set: EXPIRED/CANCELLED/REVOKED/COMPLETED must all permit a new
-- enrollment row (re-enrollment, retake), and the index correctly excludes
-- all four. No change was made to it; it is NOT redefined by this
-- migration.
