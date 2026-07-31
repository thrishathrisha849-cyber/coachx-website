-- CreateEnum
CREATE TYPE "lesson_resource_type" AS ENUM ('PDF', 'WORKSHEET', 'SPREADSHEET', 'TEMPLATE', 'IMAGE', 'AUDIO', 'ZIP', 'PRESENTATION', 'PROMPT_PACK');

-- CreateEnum
CREATE TYPE "lesson_resource_download_permission" AS ENUM ('VIEW_ONLY', 'DOWNLOADABLE');

-- CreateEnum
CREATE TYPE "lesson_resource_access_rule" AS ENUM ('PREVIEW', 'ENROLLED_ONLY');

-- AlterEnum
ALTER TYPE "learning_event_type" ADD VALUE 'RESOURCE_VIEWED';
ALTER TYPE "learning_event_type" ADD VALUE 'RESOURCE_DOWNLOAD_STARTED';

-- CreateTable
CREATE TABLE "lesson_resources" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "type" "lesson_resource_type" NOT NULL,
    "description" TEXT,
    "language" VARCHAR(10) NOT NULL DEFAULT 'EN',
    "file_url" VARCHAR(500) NOT NULL,
    "file_size_bytes" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "download_permission" "lesson_resource_download_permission" NOT NULL DEFAULT 'DOWNLOADABLE',
    "access_rule" "lesson_resource_access_rule" NOT NULL DEFAULT 'ENROLLED_ONLY',
    "position" INTEGER NOT NULL,
    "status" "course_module_status" NOT NULL DEFAULT 'DRAFT',
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "lesson_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_resources_lesson_id_status_idx" ON "lesson_resources"("lesson_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_resources_lesson_id_position_key" ON "lesson_resources"("lesson_id", "position");

-- AddForeignKey
ALTER TABLE "lesson_resources" ADD CONSTRAINT "lesson_resources_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
