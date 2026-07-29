-- CreateEnum
CREATE TYPE "roadmap_generation_source" AS ENUM ('AI', 'DETERMINISTIC_FALLBACK');

-- CreateTable
CREATE TABLE "onboarding_step_responses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "step_number" INTEGER NOT NULL,
    "step_key" VARCHAR(40) NOT NULL,
    "answer" JSONB NOT NULL,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_step_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmaps" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "goal_summary" TEXT NOT NULL,
    "current_stage" VARCHAR(60) NOT NULL,
    "recommended_learning_path" VARCHAR(200),
    "recommended_first_course_slug" VARCHAR(220),
    "recommended_community_group" VARCHAR(200),
    "recommended_challenge" VARCHAR(200),
    "recommended_event" VARCHAR(200),
    "recommended_ai_tool" VARCHAR(200),
    "expected_weekly_commitment" VARCHAR(120),
    "first_milestone" VARCHAR(300) NOT NULL,
    "generated_by" "roadmap_generation_source" NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "onboarding_step_responses_user_id_idx" ON "onboarding_step_responses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_step_responses_user_id_step_number_key" ON "onboarding_step_responses"("user_id", "step_number");

-- CreateIndex
CREATE UNIQUE INDEX "roadmaps_user_id_key" ON "roadmaps"("user_id");

-- AddForeignKey
ALTER TABLE "onboarding_step_responses" ADD CONSTRAINT "onboarding_step_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

