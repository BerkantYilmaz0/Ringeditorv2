-- Job.dueTime: BigInt (ms) → DateTime
ALTER TABLE "jobs" ADD COLUMN "due_time_new" TIMESTAMP(3);
UPDATE "jobs" SET "due_time_new" = to_timestamp(due_time::double precision / 1000);
ALTER TABLE "jobs" DROP COLUMN "due_time";
ALTER TABLE "jobs" RENAME COLUMN "due_time_new" TO "due_time";
ALTER TABLE "jobs" ALTER COLUMN "due_time" SET NOT NULL;

-- TemplateJob.dueTime: BigInt (ms) → DateTime
ALTER TABLE "template_jobs" ADD COLUMN "due_time_new" TIMESTAMP(3);
UPDATE "template_jobs" SET "due_time_new" = to_timestamp(due_time::double precision / 1000);
ALTER TABLE "template_jobs" DROP COLUMN "due_time";
ALTER TABLE "template_jobs" RENAME COLUMN "due_time_new" TO "due_time";
ALTER TABLE "template_jobs" ALTER COLUMN "due_time" SET NOT NULL;
