-- CreateEnum
CREATE TYPE "learning_event_type" AS ENUM ('COURSE_VIEWED', 'COURSE_ENROLLED', 'COURSE_STARTED', 'LESSON_VIEWED', 'VIDEO_STARTED', 'VIDEO_PROGRESSED', 'LESSON_COMPLETED', 'QUIZ_STARTED', 'QUIZ_SUBMITTED', 'QUIZ_PASSED', 'QUIZ_FAILED', 'ASSIGNMENT_STARTED', 'ASSIGNMENT_SUBMITTED', 'ASSIGNMENT_REVIEWED', 'COURSE_COMPLETED', 'CERTIFICATE_ISSUED', 'RESOURCE_DOWNLOADED');

-- CreateTable
CREATE TABLE "learning_events" (
    "id" UUID NOT NULL,
    "event_type" "learning_event_type" NOT NULL,
    "user_id" UUID,
    "course_id" UUID,
    "lesson_id" UUID,
    "enrollment_id" UUID,
    "metadata" JSONB,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_events_event_type_occurred_at_idx" ON "learning_events"("event_type", "occurred_at");

-- CreateIndex
CREATE INDEX "learning_events_course_id_event_type_idx" ON "learning_events"("course_id", "event_type");

-- CreateIndex
CREATE INDEX "learning_events_user_id_occurred_at_idx" ON "learning_events"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "learning_events_lesson_id_event_type_idx" ON "learning_events"("lesson_id", "event_type");

