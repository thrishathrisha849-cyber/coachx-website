-- CreateEnum
CREATE TYPE "question_difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "question_bank_review_status" AS ENUM ('DRAFT', 'APPROVED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "question_bank_items" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "type" "question_type" NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "category" VARCHAR(100),
    "difficulty" "question_difficulty" NOT NULL DEFAULT 'MEDIUM',
    "learning_objective" VARCHAR(300),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "language" VARCHAR(10) NOT NULL DEFAULT 'EN',
    "version" INTEGER NOT NULL DEFAULT 1,
    "review_status" "question_bank_review_status" NOT NULL DEFAULT 'DRAFT',
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "answer_key" JSONB,
    "status" "question_status" NOT NULL DEFAULT 'DRAFT',
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "question_bank_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_bank_item_options" (
    "id" UUID NOT NULL,
    "question_bank_item_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,

    CONSTRAINT "question_bank_item_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_bank_items_course_id_status_idx" ON "question_bank_items"("course_id", "status");

-- CreateIndex
CREATE INDEX "question_bank_items_course_id_category_idx" ON "question_bank_items"("course_id", "category");

-- CreateIndex
CREATE INDEX "question_bank_items_course_id_difficulty_idx" ON "question_bank_items"("course_id", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "question_bank_item_options_question_bank_item_id_position_key" ON "question_bank_item_options"("question_bank_item_id", "position");

-- AddForeignKey
ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bank_item_options" ADD CONSTRAINT "question_bank_item_options_question_bank_item_id_fkey" FOREIGN KEY ("question_bank_item_id") REFERENCES "question_bank_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
