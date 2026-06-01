-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN "capacity" INTEGER,
                        ADD COLUMN "last_service_date" DATE,
                        ADD COLUMN "next_service_date" DATE;
