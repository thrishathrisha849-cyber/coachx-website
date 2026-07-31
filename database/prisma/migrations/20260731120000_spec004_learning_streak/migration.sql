-- AlterTable
ALTER TABLE "lms_settings" ADD COLUMN     "streak_grace_days" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "streak_min_learning_time_minutes" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "streak_qualify_assignment_activity" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "streak_qualify_lesson_complete" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "streak_qualify_min_learning_time" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "streak_qualify_quiz_complete" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "streak_timezone" VARCHAR(64) NOT NULL DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "learning_streaks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "current_streak_days" INTEGER NOT NULL DEFAULT 0,
    "longest_streak_days" INTEGER NOT NULL DEFAULT 0,
    "last_qualifying_date" DATE,
    "todays_learning_seconds" INTEGER NOT NULL DEFAULT 0,
    "todays_learning_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "learning_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learning_streaks_user_id_key" ON "learning_streaks"("user_id");

-- AddForeignKey
ALTER TABLE "learning_streaks" ADD CONSTRAINT "learning_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
