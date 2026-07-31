-- CreateEnum
CREATE TYPE "waitlist_entry_status" AS ENUM ('WAITING', 'OFFERED', 'CLAIMED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "waitlist_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "priority" INTEGER NOT NULL,
    "referral_source" VARCHAR(100),
    "status" "waitlist_entry_status" NOT NULL DEFAULT 'WAITING',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offered_at" TIMESTAMPTZ(6),
    "offer_expires_at" TIMESTAMPTZ(6),
    "offer_email_sent_at" TIMESTAMPTZ(6),
    "claimed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "waitlist_entries_course_id_status_priority_idx" ON "waitlist_entries"("course_id", "status", "priority");

-- Partial unique index: at most one WAITING or OFFERED entry per
-- (user, course) — same hand-added-partial-index pattern as
-- `enrollments_one_active_per_user_course` (Prisma's DSL cannot express a
-- WHERE-scoped unique constraint). A CLAIMED/EXPIRED/CANCELLED entry does
-- NOT block rejoining the waitlist for the same (user, course).
CREATE UNIQUE INDEX "waitlist_entries_one_active_per_user_course" ON "waitlist_entries"("user_id", "course_id") WHERE "status" IN ('WAITING', 'OFFERED');

-- AddForeignKey
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
