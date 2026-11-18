-- ============================================================
-- FIGHTER RESET JOURNAL – FELHASZNÁLÓNÉV-ALAPÚ BELÉPÉS
-- A jelenlegi public.profiles és auth.users táblákra épül.
-- SQL Editorban, postgres szerepkörrel futtasd.
-- A meglévő Auth-fiókokat, jelszavakat, naplókat és csoportokat nem törli.
-- ============================================================

BEGIN;

-- 1. Felhasználónév mező.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

-- 2. Egyedi névgenerátor: e-mail @ előtti része, ütközés esetén sorszám.
CREATE OR REPLACE FUNCTION public.generate_unique_username(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_base text;
  v_candidate text;
  v_suffix integer := 1;
  v_suffix_text text;
BEGIN
  v_base := lower(split_part(coalesce(p_email, ''), '@', 1));
  v_base := regexp_replace(v_base, '[^a-z0-9._-]', '', 'g');
  v_base := regexp_replace(v_base, '^[._-]+|[._-]+$', '', 'g');
  v_base := left(v_base, 32);

  IF v_base = '' THEN
    v_base := 'user';
  END IF;

  LOOP
    IF v_suffix = 1 THEN
      v_candidate := v_base;
    ELSE
      v_suffix_text := v_suffix::text;
      v_candidate := left(v_base, 32 - length(v_suffix_text)) || v_suffix_text;
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtextextended('fighter-reset-username:' || v_candidate, 0)
    );

    IF NOT EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.username = v_candidate
    ) THEN
      RETURN v_candidate;
    END IF;

    v_suffix := v_suffix + 1;
  END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION public.generate_unique_username(text)
  FROM PUBLIC, anon, authenticated, service_role;

-- A profiles.email mezőt szinkronizáljuk az Auth tényleges e-mail-címével.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id
  AND p.email IS DISTINCT FROM u.email;

-- 3. Meglévő felhasználók feltöltése. Már létező username-et nem ír felül.
DO $block$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.id, p.email
    FROM public.profiles p
    WHERE p.username IS NULL OR btrim(p.username) = ''
    ORDER BY p.created_at NULLS FIRST, p.id
  LOOP
    UPDATE public.profiles
    SET username = public.generate_unique_username(r.email)
    WHERE id = r.id;
  END LOOP;
END;
$block$;

-- 4. Adatbázis-szintű formátum és egyediség.
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_username_format_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_username_format_check
      CHECK (username ~ '^[a-z0-9][a-z0-9._-]{0,31}$');
  END IF;
END;
$block$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON public.profiles (username);

ALTER TABLE public.profiles
  ALTER COLUMN username SET NOT NULL;

-- A profiles meglévő RLS UPDATE policy-je (id = auth.uid()) marad érvényben.
-- Oszlopszintű jogosultság: a bejelentkezett felhasználó csak username-et
-- módosíthat; az email, role, coach_id és id nem módosítható ezzel a joggal.
REVOKE UPDATE (username) ON TABLE public.profiles FROM PUBLIC, anon;
GRANT UPDATE (username) ON TABLE public.profiles TO authenticated;

-- 5. Új Auth-fiók esetén automatikus profil és felhasználónév.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.profiles AS existing_profile (id, email, role, username)
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    public.generate_unique_username(NEW.email)
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        username = COALESCE(existing_profile.username, EXCLUDED.username);

  RETURN NEW;
END;
$function$;

-- 6. Ha a Auth e-mail-címe később megváltozik és megerősítik, a profilban
-- is frissüljön az email. A felhasználó által beállított username-et megtartja.
CREATE OR REPLACE FUNCTION public.sync_profile_email_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_profile_email_from_auth()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION public.sync_profile_email_from_auth();

-- 7. Privát rate-limit tábla. A kliens-szerepkörök nem férnek hozzá.
CREATE TABLE IF NOT EXISTS public.username_login_attempts (
  key_hash text PRIMARY KEY
    CHECK (key_hash ~ '^[a-f0-9]{64}$'),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.username_login_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.username_login_attempts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.username_login_attempts TO service_role;

CREATE INDEX IF NOT EXISTS username_login_attempts_updated_at_idx
  ON public.username_login_attempts (updated_at);

-- Atomikus limit: azonos IP+felhasználónév párosnál 10 / 15 perc;
-- az IP szintű külön limitet a függvény 100 / 15 percre hívja.
CREATE OR REPLACE FUNCTION public.consume_username_login_attempt(
  p_key_hash text,
  p_max_attempts integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_attempts integer;
  v_window_started_at timestamptz;
  v_blocked_until timestamptz;
  v_limit integer;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_key_hash IS NULL OR p_key_hash !~ '^[a-f0-9]{64}$' THEN
    RETURN jsonb_build_object('allowed', false, 'retry_after_seconds', 900);
  END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_max_attempts, 10), 1), 200);

  INSERT INTO public.username_login_attempts
    (key_hash, attempts, window_started_at, updated_at)
  VALUES (p_key_hash, 0, v_now, v_now)
  ON CONFLICT (key_hash) DO NOTHING;

  SELECT attempts, window_started_at, blocked_until
  INTO v_attempts, v_window_started_at, v_blocked_until
  FROM public.username_login_attempts
  WHERE key_hash = p_key_hash
  FOR UPDATE;

  IF v_blocked_until IS NOT NULL AND v_blocked_until > v_now THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'retry_after_seconds', GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_blocked_until - v_now)))::integer)
    );
  END IF;

  IF v_window_started_at < v_now - interval '15 minutes' THEN
    UPDATE public.username_login_attempts
    SET attempts = 1,
        window_started_at = v_now,
        blocked_until = NULL,
        updated_at = v_now
    WHERE key_hash = p_key_hash;
    RETURN jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
  END IF;

  IF v_attempts >= v_limit THEN
    UPDATE public.username_login_attempts
    SET blocked_until = v_now + interval '15 minutes',
        updated_at = v_now
    WHERE key_hash = p_key_hash;
    RETURN jsonb_build_object('allowed', false, 'retry_after_seconds', 900);
  END IF;

  UPDATE public.username_login_attempts
  SET attempts = attempts + 1,
      updated_at = v_now
  WHERE key_hash = p_key_hash;

  RETURN jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_username_login_attempt(p_key_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF p_key_hash IS NULL OR p_key_hash !~ '^[a-f0-9]{64}$' THEN
    RETURN false;
  END IF;
  DELETE FROM public.username_login_attempts WHERE key_hash = p_key_hash;
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_username_login_attempt(text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_username_login_attempt(text, integer)
  TO service_role;

REVOKE ALL ON FUNCTION public.reset_username_login_attempt(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_username_login_attempt(text)
  TO service_role;

COMMIT;

-- 8. Ellenőrző összesítés (nem jelenít meg e-mail-címeket vagy más személyes adatot).
SELECT
  count(*) AS profiles_total,
  count(username) AS profiles_with_username,
  count(*) FILTER (WHERE username !~ '^[a-z0-9][a-z0-9._-]{0,31}$') AS invalid_usernames,
  count(*) - count(DISTINCT username) AS duplicate_usernames,
  has_column_privilege('authenticated', 'public.profiles', 'username', 'UPDATE') AS user_can_update_username,
  has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE') AS user_can_update_role,
  has_table_privilege('anon', 'public.username_login_attempts', 'SELECT') AS anon_can_read_rate_limits;

-- A tárolt rate-limit hash-ek automatikus időszakos takarításához opcionálisan
-- futtatható: DELETE FROM public.username_login_attempts
--             WHERE updated_at < now() - interval '7 days';
