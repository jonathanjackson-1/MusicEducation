-- Row level security policies leveraging the app.current_studio setting.
-- Run these statements for each tenant scoped table after enabling the
-- app.current_studio setting via Prisma middleware.

ALTER TABLE "Lesson" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson_tenant_isolation" ON "Lesson"
  USING ("studioId" = current_setting('app.current_studio')::uuid)
  WITH CHECK ("studioId" = current_setting('app.current_studio')::uuid);

ALTER TABLE "Grade" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grade_tenant_isolation" ON "Grade"
  USING ("studioId" = current_setting('app.current_studio')::uuid)
  WITH CHECK ("studioId" = current_setting('app.current_studio')::uuid);

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auditlog_tenant_isolation" ON "AuditLog"
  USING ("studioId" = current_setting('app.current_studio')::uuid)
  WITH CHECK ("studioId" = current_setting('app.current_studio')::uuid);

ALTER TABLE "Consent" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consent_tenant_isolation" ON "Consent"
  USING ("studioId" = current_setting('app.current_studio')::uuid)
  WITH CHECK ("studioId" = current_setting('app.current_studio')::uuid);

ALTER TABLE "DataRequest" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "datarequest_tenant_isolation" ON "DataRequest"
  USING ("studioId" = current_setting('app.current_studio')::uuid)
  WITH CHECK ("studioId" = current_setting('app.current_studio')::uuid);

ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscription_tenant_isolation" ON "Subscription"
  USING ("studioId" = current_setting('app.current_studio')::uuid)
  WITH CHECK ("studioId" = current_setting('app.current_studio')::uuid);

ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoice_tenant_isolation" ON "Invoice"
  USING ("studioId" = current_setting('app.current_studio')::uuid)
  WITH CHECK ("studioId" = current_setting('app.current_studio')::uuid);
