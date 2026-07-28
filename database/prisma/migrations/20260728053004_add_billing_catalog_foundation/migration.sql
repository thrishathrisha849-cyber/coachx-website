-- CreateEnum
CREATE TYPE "product_type" AS ENUM ('MEMBERSHIP_INDIVIDUAL', 'MEMBERSHIP_TEAM', 'MEMBERSHIP_ORGANIZATION', 'COURSE', 'COURSE_BUNDLE', 'COHORT_PROGRAM', 'WORKSHOP', 'EVENT_TICKET', 'MENTOR_SESSION', 'MENTOR_PACKAGE', 'EBOOK', 'TEMPLATE', 'DIGITAL_TOOLKIT', 'PODCAST_PREMIUM', 'AI_CREDITS', 'AI_SUBSCRIPTION_ADDON', 'CERTIFICATION_FEE', 'CHALLENGE_ENTRY', 'MERCHANDISE', 'GIFT_MEMBERSHIP', 'CUSTOM');

-- CreateEnum
CREATE TYPE "product_pricing_model" AS ENUM ('FREE', 'ONE_TIME_FIXED', 'RECURRING_FIXED', 'USAGE_BASED', 'PER_SEAT', 'TIERED', 'PACKAGE', 'PAY_WHAT_YOU_WANT', 'CUSTOM_QUOTE', 'INSTALLMENT', 'DEPOSIT_PLUS_BALANCE', 'ADD_ON', 'CREDIT_BASED_REDEMPTION', 'POINTS_PLUS_CASH', 'PROMOTIONAL_TEMPORARY');

-- CreateEnum
CREATE TYPE "product_fulfilment_method" AS ENUM ('INSTANT', 'MANUAL', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('DRAFT', 'REVIEW_PENDING', 'APPROVED', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'SOLD_OUT', 'EXPIRED', 'ARCHIVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "tax_inclusion_type" AS ENUM ('INCLUSIVE', 'EXCLUSIVE');

-- CreateEnum
CREATE TYPE "billing_interval" AS ENUM ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'MULTI_YEAR', 'CUSTOM_CONTRACT');

-- CreateEnum
CREATE TYPE "price_status" AS ENUM ('DRAFT', 'ACTIVE', 'SCHEDULED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "membership_plan_status" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "plan_version_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "plan_recommended_reason" AS ENUM ('BEST_VALUE', 'MOST_POPULAR', 'EDITOR_CHOICE');

-- CreateEnum
CREATE TYPE "entitlement_type" AS ENUM ('BOOLEAN_ACCESS', 'NUMERIC_QUOTA', 'CURRENCY_CREDIT', 'PERCENTAGE_DISCOUNT', 'CONTENT_SCOPE', 'ROLE_GRANT', 'TIME_LIMITED_ACCESS', 'USAGE_RESET', 'SEAT_BASED_ACCESS', 'REGION_RESTRICTED_ACCESS');

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "type" "product_type" NOT NULL,
    "description" TEXT,
    "short_description" VARCHAR(300),
    "media_urls" TEXT[],
    "category" VARCHAR(100),
    "seller_id" UUID,
    "pricing_model" "product_pricing_model" NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "tax_category" VARCHAR(60),
    "fulfilment_method" "product_fulfilment_method" NOT NULL DEFAULT 'INSTANT',
    "availability_start_at" TIMESTAMPTZ(6),
    "availability_end_at" TIMESTAMPTZ(6),
    "max_quantity" INTEGER,
    "refund_policy" TEXT,
    "terms_version" VARCHAR(40),
    "status" "product_status" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_prices" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "price_lineage_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "currency" VARCHAR(3) NOT NULL,
    "unit_amount_minor" INTEGER NOT NULL,
    "tax_inclusion" "tax_inclusion_type" NOT NULL DEFAULT 'EXCLUSIVE',
    "billing_interval" "billing_interval" NOT NULL,
    "interval_count" INTEGER NOT NULL DEFAULT 1,
    "trial_period_days" INTEGER,
    "setup_fee_minor" INTEGER,
    "min_quantity" INTEGER,
    "max_quantity" INTEGER,
    "effective_start_at" TIMESTAMPTZ(6),
    "effective_end_at" TIMESTAMPTZ(6),
    "region" VARCHAR(60),
    "user_segment" VARCHAR(60),
    "provider_price_reference" VARCHAR(200),
    "status" "price_status" NOT NULL DEFAULT 'DRAFT',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_plans" (
    "id" UUID NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "product_id" UUID NOT NULL,
    "status" "membership_plan_status" NOT NULL DEFAULT 'DRAFT',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_versions" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "public_description" TEXT,
    "internal_description" TEXT,
    "target_customer" VARCHAR(300),
    "features" TEXT[],
    "limits" JSONB,
    "supported_billing_intervals" "billing_interval"[],
    "trial_eligible" BOOLEAN NOT NULL DEFAULT false,
    "trial_days" INTEGER,
    "upgrade_paths" JSONB,
    "downgrade_paths" JSONB,
    "cancellation_policy" TEXT,
    "grace_period_policy" TEXT,
    "refund_policy" TEXT,
    "badge_text" VARCHAR(60),
    "recommended_reason" "plan_recommended_reason",
    "status" "plan_version_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_entitlements" (
    "id" UUID NOT NULL,
    "plan_version_id" UUID NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "type" "entitlement_type" NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_type_status_idx" ON "products"("type", "status");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "product_prices_product_id_status_idx" ON "product_prices"("product_id", "status");

-- CreateIndex
CREATE INDEX "product_prices_price_lineage_id_idx" ON "product_prices"("price_lineage_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_plans_code_key" ON "membership_plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "membership_plans_product_id_key" ON "membership_plans"("product_id");

-- CreateIndex
CREATE INDEX "membership_plans_status_display_order_idx" ON "membership_plans"("status", "display_order");

-- CreateIndex
CREATE INDEX "plan_versions_plan_id_status_idx" ON "plan_versions"("plan_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "plan_versions_plan_id_version_number_key" ON "plan_versions"("plan_id", "version_number");

-- CreateIndex
CREATE INDEX "plan_entitlements_plan_version_id_idx" ON "plan_entitlements"("plan_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_entitlements_plan_version_id_key_key" ON "plan_entitlements"("plan_version_id", "key");

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_plans" ADD CONSTRAINT "membership_plans_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "membership_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_entitlements" ADD CONSTRAINT "plan_entitlements_plan_version_id_fkey" FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Partial unique index: at most one PUBLISHED version per plan at a time.
-- Prisma has no `@@unique(... WHERE ...)` syntax, so this DB-level
-- guarantee is hand-added, same pattern as
-- `course_instructors_one_primary_per_course` / `enrollments_one_active_per_user_course`
-- (see schema.prisma's PlanVersion doc comment and docs/lms/DATA_MODEL.md).
CREATE UNIQUE INDEX "plan_versions_one_published_per_plan" ON "plan_versions"("plan_id") WHERE "status" = 'PUBLISHED';
