-- AlterTable
ALTER TABLE "newsletter_subscribers" ADD COLUMN     "unsubscribe_token_hash" VARCHAR(64) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribe_token_hash_key" ON "newsletter_subscribers"("unsubscribe_token_hash");

