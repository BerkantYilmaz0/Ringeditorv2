-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('REGULAR', 'EXTRA');

-- Migrate existing integer values to enums
ALTER TABLE "jobs"
  ADD COLUMN "status_new" "JobStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "type_new" "JobType" NOT NULL DEFAULT 'REGULAR';

UPDATE "jobs" SET "status_new" = CASE
  WHEN status = 2 THEN 'IN_PROGRESS'::"JobStatus"
  WHEN status = 3 THEN 'COMPLETED'::"JobStatus"
  WHEN status = 4 THEN 'CANCELLED'::"JobStatus"
  ELSE 'PENDING'::"JobStatus"
END;

UPDATE "jobs" SET "type_new" = CASE
  WHEN type = 2 THEN 'EXTRA'::"JobType"
  ELSE 'REGULAR'::"JobType"
END;

ALTER TABLE "jobs" DROP COLUMN "status", DROP COLUMN "type";
ALTER TABLE "jobs" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "jobs" RENAME COLUMN "type_new" TO "type";

-- template_jobs — only has status
ALTER TABLE "template_jobs"
  ADD COLUMN "status_new" "JobStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "template_jobs" SET "status_new" = CASE
  WHEN status = 2 THEN 'IN_PROGRESS'::"JobStatus"
  WHEN status = 3 THEN 'COMPLETED'::"JobStatus"
  WHEN status = 4 THEN 'CANCELLED'::"JobStatus"
  ELSE 'PENDING'::"JobStatus"
END;

ALTER TABLE "template_jobs" DROP COLUMN "status";
ALTER TABLE "template_jobs" RENAME COLUMN "status_new" TO "status";
