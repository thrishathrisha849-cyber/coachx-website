-- CreateEnum
CREATE TYPE "course_review_status" AS ENUM ('VISIBLE', 'HIDDEN');

-- CreateTable
CREATE TABLE "course_reviews" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(200),
    "comment" TEXT,
    "outcome" VARCHAR(500),
    "would_recommend" BOOLEAN NOT NULL DEFAULT true,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "course_review_status" NOT NULL DEFAULT 'VISIBLE',
    "hidden_by" UUID,
    "hidden_at" TIMESTAMPTZ(6),
    "hidden_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "course_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_reviews_course_id_status_idx" ON "course_reviews"("course_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "course_reviews_course_id_user_id_key" ON "course_reviews"("course_id", "user_id");

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

