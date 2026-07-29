-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "translation_of_course_id" UUID;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_translation_of_course_id_fkey" FOREIGN KEY ("translation_of_course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

