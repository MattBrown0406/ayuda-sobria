-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Meeting registrations table (for admin to view Monday meeting signups)
CREATE TABLE public.meeting_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  location text,
  relationship text,
  situation text,
  consent_updates boolean NOT NULL DEFAULT false,
  consent_confidentiality boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.meeting_registrations TO anon, authenticated;
GRANT ALL ON public.meeting_registrations TO service_role;
GRANT SELECT ON public.meeting_registrations TO authenticated;
ALTER TABLE public.meeting_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_register" ON public.meeting_registrations
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admins_read_registrations" ON public.meeting_registrations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_delete_registrations" ON public.meeting_registrations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin read access to memberships & coaching orders via additional policies
CREATE POLICY "admins_read_all_memberships" ON public.memberships
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_read_all_coaching_orders" ON public.coaching_orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_read_all_profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-grant admin role to matt@soberhelpline.com on signup / verification
CREATE OR REPLACE FUNCTION public.grant_admin_for_matt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'matt@soberhelpline.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_grant_matt
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_matt();

-- Backfill: if matt already exists, grant now
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'matt@soberhelpline.com'
ON CONFLICT (user_id, role) DO NOTHING;