CREATE OR REPLACE FUNCTION public.auth_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.id FROM auth.users u
  WHERE lower(u.email) = lower(btrim(p_email))
  ORDER BY u.created_at
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.auth_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_id_by_email(text) TO service_role;

CREATE TABLE IF NOT EXISTS public.app_member_access (
  email text PRIMARY KEY CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 3 AND 320),
  tier text NOT NULL CHECK (tier IN ('essential', 'premier', 'org')),
  expires_at timestamptz,
  source text NOT NULL CHECK (source IN ('export', 'sso')),
  synced_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_member_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_member_access FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.app_member_access TO service_role;