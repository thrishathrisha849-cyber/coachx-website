-- CreateEnum
CREATE TYPE "checkout_session_status" AS ENUM ('NOT_STARTED', 'PROCESSING', 'REQUIRES_ACTION', 'SUCCESS', 'FAILED', 'CANCELLED', 'PENDING', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "coupon_discount_type" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "coupon_status" AS ENUM ('ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(200),
    "mobile" VARCHAR(20),
    "profession" VARCHAR(120),
    "business_stage" VARCHAR(60),
    "interest" VARCHAR(120),
    "lead_magnet_slug" VARCHAR(191) NOT NULL,
    "utm_source" VARCHAR(120),
    "utm_medium" VARCHAR(120),
    "utm_campaign" VARCHAR(120),
    "utm_term" VARCHAR(120),
    "utm_content" VARCHAR(120),
    "referral_code" VARCHAR(60),
    "affiliate_id" VARCHAR(60),
    "landing_page_variant" VARCHAR(60),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "masterclass_configs" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "registration_closes_at" TIMESTAMPTZ(6),
    "seat_limit" INTEGER,
    "speaker_name" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "masterclass_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "masterclass_registrations" (
    "id" UUID NOT NULL,
    "config_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(20),
    "city" VARCHAR(120),
    "profession" VARCHAR(120),
    "experience_level" VARCHAR(60),
    "referral_code" VARCHAR(60),
    "registered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "masterclass_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "email" VARCHAR(255),
    "product_id" UUID NOT NULL,
    "status" "checkout_session_status" NOT NULL DEFAULT 'NOT_STARTED',
    "last_completed_step" VARCHAR(60),
    "cart_value_minor" INTEGER,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "coupon_code" VARCHAR(60),
    "utm_source" VARCHAR(120),
    "utm_medium" VARCHAR(120),
    "utm_campaign" VARCHAR(120),
    "abandoned_at" TIMESTAMPTZ(6),
    "recovery_email_sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "discount_type" "coupon_discount_type" NOT NULL,
    "discount_value" INTEGER NOT NULL,
    "valid_from" TIMESTAMPTZ(6),
    "valid_until" TIMESTAMPTZ(6),
    "max_redemptions" INTEGER,
    "redemption_count" INTEGER NOT NULL DEFAULT 0,
    "status" "coupon_status" NOT NULL DEFAULT 'ACTIVE',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "leads_lead_magnet_slug_email_key" ON "leads"("lead_magnet_slug", "email");

-- CreateIndex
CREATE UNIQUE INDEX "masterclass_configs_page_id_key" ON "masterclass_configs"("page_id");

-- CreateIndex
CREATE INDEX "masterclass_registrations_config_id_idx" ON "masterclass_registrations"("config_id");

-- CreateIndex
CREATE UNIQUE INDEX "masterclass_registrations_config_id_email_key" ON "masterclass_registrations"("config_id", "email");

-- CreateIndex
CREATE INDEX "checkout_sessions_status_idx" ON "checkout_sessions"("status");

-- CreateIndex
CREATE INDEX "checkout_sessions_abandoned_at_idx" ON "checkout_sessions"("abandoned_at");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- AddForeignKey
ALTER TABLE "masterclass_configs" ADD CONSTRAINT "masterclass_configs_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "masterclass_registrations" ADD CONSTRAINT "masterclass_registrations_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "masterclass_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

