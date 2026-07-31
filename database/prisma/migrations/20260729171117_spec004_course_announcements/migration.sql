-- CreateEnum
CREATE TYPE "course_announcement_priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "course_announcement_channel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "course_announcement_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "course_announcements" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "module_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "course_announcement_priority" NOT NULL DEFAULT 'NORMAL',
    "channels" "course_announcement_channel"[],
    "attachment_url" VARCHAR(500),
    "status" "course_announcement_status" NOT NULL DEFAULT 'DRAFT',
    "publish_at" TIMESTAMPTZ(6),
    "expire_at" TIMESTAMPTZ(6),
    "email_sent_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "course_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_announcements_course_id_status_idx" ON "course_announcements"("course_id", "status");

-- CreateIndex
CREATE INDEX "course_announcements_module_id_idx" ON "course_announcements"("module_id");

-- AddForeignKey
ALTER TABLE "course_announcements" ADD CONSTRAINT "course_announcements_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_announcements" ADD CONSTRAINT "course_announcements_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
