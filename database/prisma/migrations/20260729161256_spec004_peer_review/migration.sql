-- CreateEnum
CREATE TYPE "peer_review_status" AS ENUM ('PENDING', 'SUBMITTED', 'EXCUSED');

-- CreateEnum
CREATE TYPE "peer_review_moderation_status" AS ENUM ('VISIBLE', 'HIDDEN');

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "peer_review_anonymous" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "peer_review_deadline_days" INTEGER,
ADD COLUMN     "peer_review_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "peer_review_include_in_grade" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "peer_reviews_required" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "peer_reviews" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "reviewer_enrollment_id" UUID NOT NULL,
    "status" "peer_review_status" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "total_score" INTEGER,
    "claimed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ(6),
    "moderation_status" "peer_review_moderation_status" NOT NULL DEFAULT 'VISIBLE',
    "moderated_by" UUID,
    "moderated_at" TIMESTAMPTZ(6),
    "moderation_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "peer_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peer_review_criterion_scores" (
    "id" UUID NOT NULL,
    "peer_review_id" UUID NOT NULL,
    "criterion_id" UUID NOT NULL,
    "points_awarded" INTEGER NOT NULL,
    "comment" TEXT,

    CONSTRAINT "peer_review_criterion_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "peer_reviews_submission_id_status_idx" ON "peer_reviews"("submission_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "peer_reviews_submission_id_reviewer_enrollment_id_key" ON "peer_reviews"("submission_id", "reviewer_enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "peer_review_criterion_scores_peer_review_id_criterion_id_key" ON "peer_review_criterion_scores"("peer_review_id", "criterion_id");

-- AddForeignKey
ALTER TABLE "peer_reviews" ADD CONSTRAINT "peer_reviews_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_reviews" ADD CONSTRAINT "peer_reviews_reviewer_enrollment_id_fkey" FOREIGN KEY ("reviewer_enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_review_criterion_scores" ADD CONSTRAINT "peer_review_criterion_scores_peer_review_id_fkey" FOREIGN KEY ("peer_review_id") REFERENCES "peer_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_review_criterion_scores" ADD CONSTRAINT "peer_review_criterion_scores_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "rubric_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
