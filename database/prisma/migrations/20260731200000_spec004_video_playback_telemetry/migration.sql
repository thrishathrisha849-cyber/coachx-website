-- AlterTable
ALTER TABLE "activity_progress" ADD COLUMN     "completed_playback_at" TIMESTAMPTZ(6),
ADD COLUMN     "furthest_position_seconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_playback_speed" DOUBLE PRECISION,
ADD COLUMN     "last_position_seconds" INTEGER,
ADD COLUMN     "last_user_agent" VARCHAR(512),
ADD COLUMN     "playback_start_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rewatch_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "watched_seconds" INTEGER NOT NULL DEFAULT 0;
