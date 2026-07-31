-- CreateEnum
CREATE TYPE "submission_feedback_message_author_role" AS ENUM ('LEARNER', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "submission_feedback_message_type" AS ENUM ('REPLY', 'CLARIFICATION_REQUEST');

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "feedback_viewed_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "submission_feedback_messages" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "author_role" "submission_feedback_message_author_role" NOT NULL,
    "type" "submission_feedback_message_type" NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_feedback_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submission_feedback_messages_submission_id_created_at_idx" ON "submission_feedback_messages"("submission_id", "created_at");

-- AddForeignKey
ALTER TABLE "submission_feedback_messages" ADD CONSTRAINT "submission_feedback_messages_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
