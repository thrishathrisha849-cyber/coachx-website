-- CreateEnum
CREATE TYPE "assignment_submission_format" AS ENUM ('TEXT', 'LINK', 'FILE_URL', 'IMAGE_URL', 'AUDIO_URL', 'VIDEO_URL');

-- CreateEnum
CREATE TYPE "assignment_late_policy" AS ENUM ('REJECT', 'ACCEPT');

-- CreateEnum
CREATE TYPE "assignment_lifecycle_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "submission_status" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'EXCUSED');

-- AlterEnum
ALTER TYPE "lesson_completion_rule_type" ADD VALUE 'ASSIGNMENT_APPROVED';

-- CreateTable
CREATE TABLE "assignments" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "instructions" TEXT,
    "learning_outcome" VARCHAR(500),
    "submission_format" "assignment_submission_format" NOT NULL DEFAULT 'TEXT',
    "allowed_file_types" TEXT[],
    "due_at" TIMESTAMPTZ(6),
    "max_score" INTEGER NOT NULL DEFAULT 100,
    "passing_score" INTEGER NOT NULL DEFAULT 70,
    "late_policy" "assignment_late_policy" NOT NULL DEFAULT 'ACCEPT',
    "max_attempts" INTEGER,
    "status" "assignment_lifecycle_status" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubric_criteria" (
    "id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "max_points" INTEGER NOT NULL DEFAULT 10,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "rubric_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "status" "submission_status" NOT NULL DEFAULT 'DRAFT',
    "text_body" TEXT,
    "link_url" VARCHAR(500),
    "submitted_at" TIMESTAMPTZ(6),
    "is_late" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER,
    "passed" BOOLEAN,
    "reviewer_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewer_note" TEXT,
    "learner_feedback" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_criterion_scores" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "criterion_id" UUID NOT NULL,
    "points_awarded" INTEGER NOT NULL,
    "comment" TEXT,

    CONSTRAINT "submission_criterion_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assignments_lesson_id_key" ON "assignments"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "rubric_criteria_assignment_id_position_key" ON "rubric_criteria"("assignment_id", "position");

-- CreateIndex
CREATE INDEX "submissions_assignment_id_status_idx" ON "submissions"("assignment_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_enrollment_id_assignment_id_attempt_number_key" ON "submissions"("enrollment_id", "assignment_id", "attempt_number");

-- CreateIndex
CREATE UNIQUE INDEX "submission_criterion_scores_submission_id_criterion_id_key" ON "submission_criterion_scores"("submission_id", "criterion_id");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubric_criteria" ADD CONSTRAINT "rubric_criteria_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_criterion_scores" ADD CONSTRAINT "submission_criterion_scores_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_criterion_scores" ADD CONSTRAINT "submission_criterion_scores_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "rubric_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

