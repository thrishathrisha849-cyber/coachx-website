-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "project_id" UUID,
ADD COLUMN     "project_position" INTEGER;

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "course_module_status" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_module_id_status_idx" ON "projects"("module_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_project_id_project_position_key" ON "assignments"("project_id", "project_position");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
