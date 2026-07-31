-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "trust_safety_case_type" ADD VALUE 'PLAGIARISM';
ALTER TYPE "trust_safety_case_type" ADD VALUE 'UNAUTHORIZED_COLLABORATION';
ALTER TYPE "trust_safety_case_type" ADD VALUE 'IDENTITY_FRAUD';
ALTER TYPE "trust_safety_case_type" ADD VALUE 'QUIZ_CHEATING';
ALTER TYPE "trust_safety_case_type" ADD VALUE 'FABRICATED_SUBMISSION';
ALTER TYPE "trust_safety_case_type" ADD VALUE 'CERTIFICATE_FRAUD';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "trust_safety_target_type" ADD VALUE 'SUBMISSION';
ALTER TYPE "trust_safety_target_type" ADD VALUE 'QUIZ_ATTEMPT';
ALTER TYPE "trust_safety_target_type" ADD VALUE 'CERTIFICATE';

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "declared_original" BOOLEAN NOT NULL DEFAULT true;
