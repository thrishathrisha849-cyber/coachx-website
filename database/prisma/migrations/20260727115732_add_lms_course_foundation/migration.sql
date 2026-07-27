-- CreateEnum
CREATE TYPE "course_category_status" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "course_status" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "course_visibility" AS ENUM ('PUBLIC', 'UNLISTED');

-- CreateEnum
CREATE TYPE "course_level" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS');

-- CreateEnum
CREATE TYPE "course_price_type" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "course_module_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "instructor_course_role" AS ENUM ('INSTRUCTOR', 'TEACHING_ASSISTANT');

-- CreateTable
CREATE TABLE "course_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "short_description" VARCHAR(300),
    "image_url" VARCHAR(500),
    "icon" VARCHAR(60),
    "parent_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "course_category_status" NOT NULL DEFAULT 'ACTIVE',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "course_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "subtitle" VARCHAR(300),
    "short_description" VARCHAR(300),
    "description" TEXT,
    "thumbnail_url" VARCHAR(500),
    "cover_image_url" VARCHAR(500),
    "trailer_url" VARCHAR(500),
    "language" "page_language" NOT NULL DEFAULT 'EN',
    "level" "course_level" NOT NULL DEFAULT 'ALL_LEVELS',
    "status" "course_status" NOT NULL DEFAULT 'DRAFT',
    "visibility" "course_visibility" NOT NULL DEFAULT 'PUBLIC',
    "category_id" UUID,
    "duration_minutes" INTEGER,
    "estimated_completion_minutes" INTEGER,
    "price_type" "course_price_type" NOT NULL DEFAULT 'FREE',
    "price_amount_minor" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "enrollment_limit" INTEGER,
    "enrollment_start_at" TIMESTAMPTZ(6),
    "enrollment_end_at" TIMESTAMPTZ(6),
    "publish_at" TIMESTAMPTZ(6),
    "expire_at" TIMESTAMPTZ(6),
    "seo_title" VARCHAR(255),
    "seo_description" VARCHAR(500),
    "canonical_url" VARCHAR(500),
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_modules" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "status" "course_module_status" NOT NULL DEFAULT 'DRAFT',
    "is_preview" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_instructors" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "instructor_course_role" NOT NULL DEFAULT 'INSTRUCTOR',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_instructors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_categories_slug_key" ON "course_categories"("slug");

-- CreateIndex
CREATE INDEX "course_categories_parent_id_idx" ON "course_categories"("parent_id");

-- CreateIndex
CREATE INDEX "course_categories_status_sort_order_idx" ON "course_categories"("status", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_status_visibility_idx" ON "courses"("status", "visibility");

-- CreateIndex
CREATE INDEX "courses_category_id_idx" ON "courses"("category_id");

-- CreateIndex
CREATE INDEX "courses_status_publish_at_idx" ON "courses"("status", "publish_at");

-- CreateIndex
CREATE INDEX "courses_is_featured_idx" ON "courses"("is_featured");

-- CreateIndex
CREATE INDEX "course_modules_course_id_status_idx" ON "course_modules"("course_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "course_modules_course_id_position_key" ON "course_modules"("course_id", "position");

-- CreateIndex
CREATE INDEX "course_instructors_user_id_idx" ON "course_instructors"("user_id");

-- CreateIndex
CREATE INDEX "course_instructors_course_id_is_primary_idx" ON "course_instructors"("course_id", "is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "course_instructors_course_id_user_id_key" ON "course_instructors"("course_id", "user_id");

-- AddForeignKey
ALTER TABLE "course_categories" ADD CONSTRAINT "course_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "course_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "course_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Hand-added (not Prisma-generated): "at most one primary instructor per
-- course" — Prisma has no `@@unique(... WHERE ...)` syntax for a partial
-- unique index, so this DB-level guarantee is added directly to the
-- generated migration as a second, defense-in-depth layer alongside the
-- service-layer transactional check (see backend/src/lms/instructor.service.ts
-- and docs/lms/DATA_MODEL.md). A plain @@unique([courseId, isPrimary]) would
-- be wrong here — it would also block two DIFFERENT non-primary instructors
-- on the same course, which is allowed.
CREATE UNIQUE INDEX "course_instructors_one_primary_per_course" ON "course_instructors"("course_id") WHERE "is_primary" = true;

