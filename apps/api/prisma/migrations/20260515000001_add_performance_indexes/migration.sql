-- Job tablosu için performans index'leri
CREATE INDEX IF NOT EXISTS "jobs_due_time_idx" ON "jobs"("due_time");
CREATE INDEX IF NOT EXISTS "jobs_vehicle_id_idx" ON "jobs"("vehicle_id");
CREATE INDEX IF NOT EXISTS "jobs_route_id_idx" ON "jobs"("route_id");

-- TemplateJob tablosu için index'ler
CREATE INDEX IF NOT EXISTS "template_jobs_template_id_idx" ON "template_jobs"("template_id");
CREATE INDEX IF NOT EXISTS "template_jobs_vehicle_id_idx" ON "template_jobs"("vehicle_id");

-- RouteStop tablosu için index
CREATE INDEX IF NOT EXISTS "route_stops_route_id_idx" ON "route_stops"("route_id");

-- Stop tablosu için isim arama index'i
CREATE INDEX IF NOT EXISTS "stops_name_idx" ON "stops"("name");
