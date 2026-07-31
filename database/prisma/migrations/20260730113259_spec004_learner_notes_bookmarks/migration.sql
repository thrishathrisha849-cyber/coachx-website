-- CreateEnum
CREATE TYPE "bookmark_type" AS ENUM ('LESSON', 'VIDEO_TIMESTAMP', 'TEXT_SECTION', 'RESOURCE', 'DISCUSSION');

-- CreateTable
CREATE TABLE "learner_notes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "video_timestamp_seconds" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "learner_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "type" "bookmark_type" NOT NULL,
    "video_timestamp_seconds" INTEGER,
    "text_section_anchor" VARCHAR(255),
    "activity_id" UUID,
    "note" TEXT,
    "folder" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learner_notes_user_id_lesson_id_idx" ON "learner_notes"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "learner_notes_user_id_course_id_idx" ON "learner_notes"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "bookmarks_user_id_lesson_id_idx" ON "bookmarks"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "bookmarks_user_id_course_id_idx" ON "bookmarks"("user_id", "course_id");

-- AddForeignKey
ALTER TABLE "learner_notes" ADD CONSTRAINT "learner_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_notes" ADD CONSTRAINT "learner_notes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_notes" ADD CONSTRAINT "learner_notes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "learning_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
