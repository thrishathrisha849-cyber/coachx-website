-- CreateTable
CREATE TABLE "wishlist_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "price_at_save_amount_minor" INTEGER NOT NULL,
    "price_at_save_currency" VARCHAR(3) NOT NULL,
    "enrollment_open_notified_at" TIMESTAMPTZ(6),
    "price_drop_notified_at" TIMESTAMPTZ(6),
    "saved_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wishlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wishlist_entries_course_id_idx" ON "wishlist_entries"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_entries_user_id_course_id_key" ON "wishlist_entries"("user_id", "course_id");

-- AddForeignKey
ALTER TABLE "wishlist_entries" ADD CONSTRAINT "wishlist_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_entries" ADD CONSTRAINT "wishlist_entries_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
