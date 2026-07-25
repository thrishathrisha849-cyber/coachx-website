-- CreateEnum
CREATE TYPE "page_language" AS ENUM ('EN', 'TA', 'TANGLISH');

-- CreateEnum
CREATE TYPE "page_status" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "page_template" AS ENUM ('STANDARD', 'HOME', 'BLOG_POST');

-- CreateEnum
CREATE TYPE "page_block_type" AS ENUM ('HERO', 'TEXT', 'IMAGE', 'VIDEO', 'CTA', 'FEATURES', 'STATS', 'TESTIMONIALS', 'PRICING', 'FAQ', 'TIMELINE', 'TEAM', 'LOGO_STRIP', 'PROGRAMS', 'COURSES', 'EVENTS', 'MENTORS', 'FORM', 'CUSTOM_HTML', 'SPACER', 'DIVIDER');

-- CreateEnum
CREATE TYPE "nav_location" AS ENUM ('HEADER', 'FOOTER', 'MOBILE');

-- CreateEnum
CREATE TYPE "consent_channel" AS ENUM ('TERMS', 'PRIVACY', 'MARKETING_EMAIL', 'WHATSAPP', 'SMS', 'PARTNER_COMMUNICATION', 'PERSONALIZATION_COOKIES');

-- CreateEnum
CREATE TYPE "contact_department" AS ENUM ('GENERAL_ENQUIRY', 'MEMBERSHIP', 'COURSE', 'PAYMENT', 'PARTNERSHIP', 'CORPORATE_TRAINING', 'MEDIA', 'TECHNICAL_SUPPORT');

-- CreateTable
CREATE TABLE "pages" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(191) NOT NULL,
    "language" "page_language" NOT NULL DEFAULT 'EN',
    "template" "page_template" NOT NULL DEFAULT 'STANDARD',
    "status" "page_status" NOT NULL DEFAULT 'DRAFT',
    "title" VARCHAR(255) NOT NULL,
    "seo_title" VARCHAR(255),
    "seo_description" VARCHAR(500),
    "canonical_url" VARCHAR(500),
    "og_image_url" VARCHAR(500),
    "no_index" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "audience_roles" TEXT[],
    "header_visible" BOOLEAN NOT NULL DEFAULT true,
    "footer_visible" BOOLEAN NOT NULL DEFAULT true,
    "publish_at" TIMESTAMPTZ(6),
    "expire_at" TIMESTAMPTZ(6),
    "preview_token" VARCHAR(64),
    "preview_expires_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_blocks" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "type" "page_block_type" NOT NULL,
    "order" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "page_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_versions" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "edited_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_items" (
    "id" UUID NOT NULL,
    "location" "nav_location" NOT NULL,
    "parent_id" UUID,
    "label" VARCHAR(100) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "is_external" BOOLEAN NOT NULL DEFAULT false,
    "required_permission" VARCHAR(100),
    "mega_menu_column" VARCHAR(100),
    "order" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "navigation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "text" VARCHAR(500) NOT NULL,
    "icon" VARCHAR(50),
    "cta_label" VARCHAR(100),
    "cta_url" VARCHAR(500),
    "style" VARCHAR(20) NOT NULL DEFAULT 'info',
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "audience_roles" TEXT[],
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redirects" (
    "id" UUID NOT NULL,
    "from_path" VARCHAR(500) NOT NULL,
    "to_path" VARCHAR(500) NOT NULL,
    "status_code" INTEGER NOT NULL DEFAULT 301,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redirects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_entries" (
    "id" UUID NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "question" VARCHAR(500) NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "faq_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "email" VARCHAR(255),
    "channel" "consent_channel" NOT NULL,
    "policy_version" VARCHAR(20) NOT NULL,
    "source" VARCHAR(100) NOT NULL,
    "ip_address" VARCHAR(45),
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMPTZ(6),

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_submissions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(30),
    "department" "contact_department" NOT NULL,
    "message" TEXT NOT NULL,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "subscribed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribed_at" TIMESTAMPTZ(6),

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pages_preview_token_key" ON "pages"("preview_token");

-- CreateIndex
CREATE INDEX "pages_status_publish_at_idx" ON "pages"("status", "publish_at");

-- CreateIndex
CREATE INDEX "pages_template_idx" ON "pages"("template");

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_language_key" ON "pages"("slug", "language");

-- CreateIndex
CREATE INDEX "page_blocks_page_id_order_idx" ON "page_blocks"("page_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "page_versions_page_id_version_number_key" ON "page_versions"("page_id", "version_number");

-- CreateIndex
CREATE INDEX "navigation_items_location_parent_id_order_idx" ON "navigation_items"("location", "parent_id", "order");

-- CreateIndex
CREATE INDEX "announcements_start_date_end_date_priority_idx" ON "announcements"("start_date", "end_date", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "redirects_from_path_key" ON "redirects"("from_path");

-- CreateIndex
CREATE INDEX "faq_entries_category_order_idx" ON "faq_entries"("category", "order");

-- CreateIndex
CREATE INDEX "consent_records_user_id_channel_idx" ON "consent_records"("user_id", "channel");

-- CreateIndex
CREATE INDEX "consent_records_email_channel_idx" ON "consent_records"("email", "channel");

-- CreateIndex
CREATE INDEX "contact_submissions_created_at_idx" ON "contact_submissions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- AddForeignKey
ALTER TABLE "page_blocks" ADD CONSTRAINT "page_blocks_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "navigation_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

