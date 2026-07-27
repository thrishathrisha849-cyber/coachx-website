-- DropIndex
DROP INDEX "pages_preview_token_key";

-- AlterTable
ALTER TABLE "pages" DROP COLUMN "preview_token",
ADD COLUMN     "preview_token_hash" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "pages_preview_token_hash_key" ON "pages"("preview_token_hash");

