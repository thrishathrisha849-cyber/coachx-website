-- CreateEnum
CREATE TYPE "organization_status" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "user_lifecycle_stage" AS ENUM ('REGISTERED_USER', 'ACTIVATED_MEMBER', 'ENGAGED_MEMBER', 'PAYING_MEMBER', 'ACHIEVER', 'ADVOCATE');

-- CreateEnum
CREATE TYPE "business_milestone_type" AS ENUM ('FIRST_CLIENT', 'FIRST_1000', 'FIRST_10000', 'FIRST_1_LAKH', 'FIRST_COURSE_LAUNCH', 'FIRST_100_COMMUNITY_MEMBERS');

-- CreateEnum
CREATE TYPE "milestone_status" AS ENUM ('CLAIMED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "lifecycle_event_type" AS ENUM ('POST_INTERACTION', 'EVENT_ATTENDANCE', 'CHALLENGE_SUBMISSION', 'REFERRAL', 'TESTIMONIAL_SUBMISSION', 'CASE_STUDY_SUBMISSION', 'MENTOR_APPLICATION', 'COMMUNITY_LEADERSHIP');

-- CreateEnum
CREATE TYPE "trust_safety_case_type" AS ENUM ('REPORT', 'BLOCK', 'MUTE');

-- CreateEnum
CREATE TYPE "trust_safety_target_type" AS ENUM ('POST', 'COMMENT', 'PROFILE', 'USER');

-- CreateEnum
CREATE TYPE "trust_safety_case_status" AS ENUM ('OPEN', 'UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED');

-- CreateEnum
CREATE TYPE "moderation_action_type" AS ENUM ('WARNING', 'TEMPORARY_SUSPENSION', 'PERMANENT_BAN');

-- CreateEnum
CREATE TYPE "appeal_status" AS ENUM ('PENDING', 'UPHELD', 'OVERTURNED');

-- CreateEnum
CREATE TYPE "product_phase" AS ENUM ('FOUNDATION_MVP', 'GROWTH_PLATFORM', 'BUSINESS_OPERATING_SYSTEM', 'ENTERPRISE_ECOSYSTEM');

-- CreateEnum
CREATE TYPE "governance_stage" AS ENUM ('REQUIREMENT_APPROVAL', 'UX_REVIEW', 'TECHNICAL_REVIEW', 'SECURITY_REVIEW', 'DEVELOPMENT', 'QA', 'UAT', 'RELEASE_APPROVAL', 'MONITORING', 'POST_RELEASE_REVIEW');

-- AlterEnum
ALTER TYPE "page_status" ADD VALUE 'UNPUBLISHED';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "affiliate_disclosure" VARCHAR(300),
ADD COLUMN     "is_affiliate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_sponsored" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sponsor_label" VARCHAR(120);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "organization_id" UUID;

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "status" "organization_status" NOT NULL DEFAULT 'ACTIVE',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_lifecycle_states" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stage" "user_lifecycle_stage" NOT NULL DEFAULT 'REGISTERED_USER',
    "language_selected" VARCHAR(10),
    "goal_selected" VARCHAR(120),
    "experience_level" VARCHAR(60),
    "skill_selected" VARCHAR(120),
    "business_stage" VARCHAR(60),
    "time_availability" VARCHAR(60),
    "interests" TEXT[],
    "niche_selected" VARCHAR(120),
    "onboarding_completed_at" TIMESTAMPTZ(6),
    "first_learning_path_started_at" TIMESTAMPTZ(6),
    "first_lesson_completed_at" TIMESTAMPTZ(6),
    "first_community_action_at" TIMESTAMPTZ(6),
    "first_offer_created_at" TIMESTAMPTZ(6),
    "first_purchase_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_lifecycle_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_milestones" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "business_milestone_type" NOT NULL,
    "status" "milestone_status" NOT NULL DEFAULT 'CLAIMED',
    "claimed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMPTZ(6),
    "verified_by" UUID,
    "rejected_reason" TEXT,
    "evidence" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "business_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifecycle_events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "lifecycle_event_type" NOT NULL,
    "metadata" JSONB,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lifecycle_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_safety_cases" (
    "id" UUID NOT NULL,
    "type" "trust_safety_case_type" NOT NULL,
    "target_type" "trust_safety_target_type" NOT NULL,
    "target_id" VARCHAR(120),
    "reporter_id" UUID,
    "reported_user_id" UUID,
    "reason" TEXT NOT NULL,
    "evidence" JSONB,
    "status" "trust_safety_case_status" NOT NULL DEFAULT 'OPEN',
    "action_type" "moderation_action_type",
    "action_reason" TEXT,
    "actioned_by" UUID,
    "actioned_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trust_safety_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appeals" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "submitted_by" UUID NOT NULL,
    "statement" TEXT NOT NULL,
    "status" "appeal_status" NOT NULL DEFAULT 'PENDING',
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "resolution_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "appeals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_records" (
    "id" UUID NOT NULL,
    "feature_name" VARCHAR(200) NOT NULL,
    "phase" "product_phase" NOT NULL,
    "current_stage" "governance_stage" NOT NULL DEFAULT 'REQUIREMENT_APPROVAL',
    "stage_history" JSONB NOT NULL DEFAULT '[]',
    "monitoring_started_at" TIMESTAMPTZ(6),
    "post_release_review_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "governance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_versions" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_lifecycle_states_user_id_key" ON "user_lifecycle_states"("user_id");

-- CreateIndex
CREATE INDEX "user_lifecycle_states_stage_idx" ON "user_lifecycle_states"("stage");

-- CreateIndex
CREATE INDEX "business_milestones_status_idx" ON "business_milestones"("status");

-- CreateIndex
CREATE UNIQUE INDEX "business_milestones_user_id_type_key" ON "business_milestones"("user_id", "type");

-- CreateIndex
CREATE INDEX "lifecycle_events_user_id_type_occurred_at_idx" ON "lifecycle_events"("user_id", "type", "occurred_at");

-- CreateIndex
CREATE INDEX "trust_safety_cases_status_idx" ON "trust_safety_cases"("status");

-- CreateIndex
CREATE INDEX "trust_safety_cases_reported_user_id_idx" ON "trust_safety_cases"("reported_user_id");

-- CreateIndex
CREATE INDEX "appeals_status_idx" ON "appeals"("status");

-- CreateIndex
CREATE INDEX "governance_records_phase_current_stage_idx" ON "governance_records"("phase", "current_stage");

-- CreateIndex
CREATE INDEX "course_versions_course_id_idx" ON "course_versions"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_versions_course_id_version_number_key" ON "course_versions"("course_id", "version_number");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lifecycle_states" ADD CONSTRAINT "user_lifecycle_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_milestones" ADD CONSTRAINT "business_milestones_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_events" ADD CONSTRAINT "lifecycle_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_safety_cases" ADD CONSTRAINT "trust_safety_cases_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_safety_cases" ADD CONSTRAINT "trust_safety_cases_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "trust_safety_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

