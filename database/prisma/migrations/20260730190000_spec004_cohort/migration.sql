-- CreateEnum
CREATE TYPE "cohort_status" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "module_release_rule_type" ADD VALUE 'COHORT_SCHEDULE';

-- CreateTable
CREATE TABLE "cohorts" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6),
    "timezone" VARCHAR(64) NOT NULL,
    "capacity" INTEGER,
    "status" "cohort_status" NOT NULL DEFAULT 'OPEN',
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_members" (
    "id" UUID NOT NULL,
    "cohort_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohort_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_module_schedules" (
    "id" UUID NOT NULL,
    "cohort_id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "unlock_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cohort_module_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cohorts_course_id_status_idx" ON "cohorts"("course_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_members_enrollment_id_key" ON "cohort_members"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_members_cohort_id_user_id_key" ON "cohort_members"("cohort_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_module_schedules_cohort_id_module_id_key" ON "cohort_module_schedules"("cohort_id", "module_id");

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_module_schedules" ADD CONSTRAINT "cohort_module_schedules_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_module_schedules" ADD CONSTRAINT "cohort_module_schedules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
