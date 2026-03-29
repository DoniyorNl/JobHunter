-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase Trigger: sync auth.users → public."User"
--
-- RUN ONCE in Supabase SQL Editor (Dashboard → SQL Editor → New Query).
--
-- Why a DB trigger instead of application code?
-- 1. Atomicity: User row is created in the same DB transaction as auth.users insert.
--    No race condition possible.
-- 2. Universality: Works for ALL auth methods — email/password, Google OAuth,
--    magic link, SSO, Admin API — without touching application code.
-- 3. Resilience: If the app server is down, signups still sync correctly.
--
-- Why SECURITY DEFINER?
-- The trigger function runs with the privileges of the function owner (postgres),
-- not the invoking user. This is required because auth.users is in the `auth`
-- schema which is not accessible to the `anon` role.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name TEXT;
BEGIN
  -- Prefer full_name from OAuth metadata, fall back to email prefix
  display_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'User'
  );

  INSERT INTO public."User" (id, email, name, "createdAt", "updatedAt")
  VALUES (
    new.id,
    new.email,
    display_name,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- Drop and recreate so re-running this file is idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
