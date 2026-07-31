-- CreateTable
CREATE TABLE "lms_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "default_video_watch_threshold_percent" INTEGER NOT NULL DEFAULT 80,
    "default_quiz_passing_score_percent" INTEGER NOT NULL DEFAULT 70,
    "default_quiz_max_attempts" INTEGER,
    "default_assignment_max_attempts" INTEGER,
    "default_resource_download_permission" "lesson_resource_download_permission" NOT NULL DEFAULT 'DOWNLOADABLE',
    "default_lesson_completion_rule_type" "lesson_completion_rule_type" NOT NULL DEFAULT 'MANUAL',
    "course_review_min_progress_percent" INTEGER NOT NULL DEFAULT 50,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_settings_pkey" PRIMARY KEY ("id")
);
