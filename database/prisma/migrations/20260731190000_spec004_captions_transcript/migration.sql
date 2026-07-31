-- AlterTable
ALTER TABLE "learning_activities" ADD COLUMN     "captions_url_en" VARCHAR(500),
ADD COLUMN     "captions_url_ta" VARCHAR(500),
ADD COLUMN     "transcript_segments" JSONB;
