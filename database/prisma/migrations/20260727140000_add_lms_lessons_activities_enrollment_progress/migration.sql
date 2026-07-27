-- Phase 6 Part 2 — Lessons, Learning Activities, Enrollment, Progress,
-- Completion Overrides (004 FR-017–060). Purely ADDITIVE: every statement
-- below either creates a new enum/table/index, or adds a new nullable
-- column to the existing `course_modules` table. No existing column is
-- altered/dropped/renamed, and no existing migration file is edited (this
-- is a NEW migration on top of `20260727125444_align_course_lifecycle_with_fr004`
-- — same "never edit a prior migration" discipline as every migration in
-- this repository, even though no live database has ever actually applied
-- any of them in this sandbox — see docs/lms/DECISION_GATES.md).
--
-- Generated via the offline `prisma migrate diff --script` workflow (no
-- live Postgres reachable in this sandbox — see docs/lms/TESTING.md), then
-- hand-reviewed. ONE manual addition was made beyond the generated diff:
-- the partial unique index at the bottom of this file (Prisma's schema DSL
-- cannot express a `WHERE`-scoped unique constraint), following the exact
-- same pattern Part 1 established for `course_instructors_one_primary_per_course`.

-- CreateEnum
CREATE TYPE "lesson_completion_rule_type" AS ENUM ('MANUAL', 'MINIMUM_WATCH_PERCENT', 'ALL_ACTIVITIES_VIEWED', 'INSTRUCTOR_APPROVAL');

-- CreateEnum
CREATE TYPE "learning_activity_type" AS ENUM ('VIDEO', 'AUDIO', 'ARTICLE', 'PDF', 'DOWNLOAD', 'EXTERNAL_LINK', 'EMBED');

-- CreateEnum
CREATE TYPE "enrollment_source" AS ENUM ('FREE', 'MEMBERSHIP', 'PURCHASE', 'PROGRAM', 'ORGANIZATION', 'ADMIN_GRANT', 'COUPON', 'SCHOLARSHIP', 'TRIAL', 'INVITE');

-- CreateEnum
CREATE TYPE "enrollment_status" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED', 'COMPLETED', 'REVOKED');

-- CreateEnum
CREATE TYPE "lesson_progress_status" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "lesson_completion_source" AS ENUM ('MANUAL_LEARNER', 'SIGNAL_DERIVED', 'INSTRUCTOR_OVERRIDE', 'ADMIN_OVERRIDE');

-- CreateEnum
CREATE TYPE "completion_override_scope" AS ENUM ('LESSON', 'MODULE', 'COURSE');

-- CreateEnum
CREATE TYPE "completion_override_action" AS ENUM ('MARK_COMPLETE', 'RESET');

-- AlterTable
ALTER TABLE "course_modules" ADD COLUMN     "manually_released_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "summary" VARCHAR(500),
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "duration_minutes" INTEGER,
    "is_preview" BOOLEAN NOT NULL DEFAULT false,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "completion_rule_type" "lesson_completion_rule_type" NOT NULL DEFAULT 'MANUAL',
    "completion_rule_value" JSONB,
    "status" "course_module_status" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_activities" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "type" "learning_activity_type" NOT NULL,
    "title" VARCHAR(200),
    "position" INTEGER NOT NULL,
    "media_url" VARCHAR(500),
    "external_url" VARCHAR(500),
    "body_text" TEXT,
    "duration_seconds" INTEGER,
    "file_size_bytes" INTEGER,
    "embed_provider" VARCHAR(60),
    "embed_resource_id" VARCHAR(200),
    "status" "course_module_status" NOT NULL DEFAULT 'DRAFT',
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "learning_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "source" "enrollment_source" NOT NULL,
    "status" "enrollment_status" NOT NULL DEFAULT 'PENDING',
    "entitlement_reference" VARCHAR(200),
    "enrolled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" TIMESTAMPTZ(6),
    "access_start_at" TIMESTAMPTZ(6),
    "access_end_at" TIMESTAMPTZ(6),
    "suspended_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "expired_at" TIMESTAMPTZ(6),
    "last_accessed_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "status" "lesson_progress_status" NOT NULL DEFAULT 'NOT_STARTED',
    "percentage" INTEGER NOT NULL DEFAULT 0,
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "last_position" JSONB,
    "started_at" TIMESTAMPTZ(6),
    "last_accessed_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "completion_source" "lesson_completion_source",
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "completion_overrides" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "scope" "completion_override_scope" NOT NULL,
    "target_id" UUID NOT NULL,
    "action" "completion_override_action" NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "actor_id" UUID NOT NULL,
    "previous_value" JSONB,
    "new_value" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "completion_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lessons_module_id_status_idx" ON "lessons"("module_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_module_id_slug_key" ON "lessons"("module_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_module_id_position_key" ON "lessons"("module_id", "position");

-- CreateIndex
CREATE INDEX "learning_activities_lesson_id_status_idx" ON "learning_activities"("lesson_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "learning_activities_lesson_id_position_key" ON "learning_activities"("lesson_id", "position");

-- CreateIndex
CREATE INDEX "enrollments_user_id_status_idx" ON "enrollments"("user_id", "status");

-- CreateIndex
CREATE INDEX "enrollments_course_id_status_idx" ON "enrollments"("course_id", "status");

-- CreateIndex
CREATE INDEX "lesson_progress_enrollment_id_idx" ON "lesson_progress"("enrollment_id");

-- CreateIndex
CREATE INDEX "lesson_progress_lesson_id_idx" ON "lesson_progress"("lesson_id");

-- CreateIndex
CREATE INDEX "lesson_progress_enrollment_id_last_accessed_at_idx" ON "lesson_progress"("enrollment_id", "last_accessed_at");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_enrollment_id_lesson_id_key" ON "lesson_progress"("enrollment_id", "lesson_id");

-- CreateIndex
CREATE INDEX "completion_overrides_enrollment_id_scope_target_id_idx" ON "completion_overrides"("enrollment_id", "scope", "target_id");

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_activities" ADD CONSTRAINT "learning_activities_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completion_overrides" ADD CONSTRAINT "completion_overrides_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- HAND-ADDED (not part of the generated diff): "at most one ACTIVE or
-- PENDING enrollment per (user, course)" — a plain @@unique([userId,
-- courseId]) would be wrong here, since it would also block a learner from
-- ever re-enrolling after a prior enrollment was CANCELLED/REVOKED/EXPIRED/
-- COMPLETED (all legitimate re-enrollment scenarios). Prisma's schema DSL
-- has no `@@unique(... WHERE ...)` syntax, so this partial unique index is
-- maintained by hand in every migration that needs one — same pattern as
-- `course_instructors_one_primary_per_course` in
-- 20260727115732_add_lms_course_foundation/migration.sql. Enforced ALSO at
-- the service layer (enrollment.service.ts checks for an existing
-- active/pending enrollment before creating a new one) — this index is the
-- database-level backstop against a race between two concurrent enrollment
-- requests, not the only check.
CREATE UNIQUE INDEX "enrollments_one_active_per_user_course" ON "enrollments"("user_id", "course_id") WHERE "status" IN ('PENDING', 'ACTIVE', 'SUSPENDED');
