-- CreateEnum
CREATE TYPE "certificate_type" AS ENUM ('COURSE_COMPLETION', 'LEARNING_PATH', 'PROGRAM_COMPLETION', 'SKILL_CERTIFICATION', 'EVENT_PARTICIPATION', 'CHALLENGE_COMPLETION', 'ORGANIZATION_TRAINING');

-- CreateEnum
CREATE TYPE "certificate_status" AS ENUM ('VALID', 'EXPIRED', 'REVOKED', 'REPLACED');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "certificate_template_id" UUID;

-- CreateTable
CREATE TABLE "certificate_templates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "background_url" VARCHAR(500),
    "logo_url" VARCHAR(500),
    "signature_url" VARCHAR(500),
    "seal_url" VARCHAR(500),
    "font_family" VARCHAR(100),
    "primary_color" VARCHAR(20),
    "language" VARCHAR(10) NOT NULL DEFAULT 'EN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "credential_id" VARCHAR(40) NOT NULL,
    "certificate_type" "certificate_type" NOT NULL DEFAULT 'COURSE_COMPLETION',
    "learner_name" VARCHAR(200) NOT NULL,
    "course_title" VARCHAR(200) NOT NULL,
    "instructor_name" VARCHAR(200),
    "organization_name" VARCHAR(200),
    "completion_date" TIMESTAMPTZ(6) NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "status" "certificate_status" NOT NULL DEFAULT 'VALID',
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_by" UUID,
    "revoked_reason" TEXT,
    "template_id" UUID,
    "eligibility_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certificates_enrollment_id_key" ON "certificates"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_credential_id_key" ON "certificates"("credential_id");

-- CreateIndex
CREATE INDEX "certificates_course_id_idx" ON "certificates"("course_id");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_certificate_template_id_fkey" FOREIGN KEY ("certificate_template_id") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

