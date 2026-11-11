-- Enable Row Level Security and revoke public/Data-API grants across all tables in the target schema.
-- Covers all 24 Prisma models (Profile, BillingSubscription, Plan, PaymentRequest, Balance, Category,
-- Transaction, TransactionTemplate, RecurringTransaction, Budget, SavingGoal, WishlistItem, Debt,
-- Paylater, AppSubscription, EmergencyFundPlan, Reminder, AuditLog, Setting, Feedback, Streak,
-- Achievement, RateLimitBucket, Notification) plus _prisma_migrations.
-- Prisma connects as the table owner / BYPASSRLS role, while anon/authenticated PostgREST access is denied by default.

DO $$
DECLARE
  r RECORD;
  target_schema TEXT := current_schema();
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = target_schema
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', target_schema, r.tablename);

    BEGIN
      EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM PUBLIC', target_schema, r.tablename);
    EXCEPTION WHEN insufficient_privilege THEN
      NULL;
    END;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      BEGIN
        EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM anon', target_schema, r.tablename);
      EXCEPTION WHEN insufficient_privilege THEN
        NULL;
      END;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      BEGIN
        EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM authenticated', target_schema, r.tablename);
      EXCEPTION WHEN insufficient_privilege THEN
        NULL;
      END;
    END IF;
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA %I FROM anon', target_schema);
    EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA %I FROM anon', target_schema);
    EXECUTE format('REVOKE USAGE ON SCHEMA %I FROM anon', target_schema);
    BEGIN
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON TABLES FROM anon', target_schema);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON SEQUENCES FROM anon', target_schema);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON FUNCTIONS FROM anon', target_schema);
    EXCEPTION WHEN insufficient_privilege THEN
      NULL;
    END;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA %I FROM authenticated', target_schema);
    EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA %I FROM authenticated', target_schema);
    EXECUTE format('REVOKE USAGE ON SCHEMA %I FROM authenticated', target_schema);
    BEGIN
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON TABLES FROM authenticated', target_schema);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON SEQUENCES FROM authenticated', target_schema);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON FUNCTIONS FROM authenticated', target_schema);
    EXCEPTION WHEN insufficient_privilege THEN
      NULL;
    END;
  END IF;
END $$;
