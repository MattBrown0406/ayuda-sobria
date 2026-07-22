
-- 1. Switch has_role to SECURITY INVOKER (works because users_read_own_roles allows caller to see own roles)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- 2. Restrict trigger helper functions (they only need to run from triggers as table owner)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_admin_for_matt() FROM PUBLIC, anon, authenticated;

-- 3. Replace overly-permissive INSERT policy on meeting_registrations
DROP POLICY IF EXISTS anyone_can_register ON public.meeting_registrations;
CREATE POLICY anyone_can_register ON public.meeting_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(full_name)) > 0
    AND length(btrim(email)) > 0
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND consent_confidentiality = true
  );

-- 4. Explicit admin-only write policies for coaching_orders
CREATE POLICY admins_insert_coaching_orders ON public.coaching_orders
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY admins_update_coaching_orders ON public.coaching_orders
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY admins_delete_coaching_orders ON public.coaching_orders
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Explicit admin-only write policies for memberships
CREATE POLICY admins_insert_memberships ON public.memberships
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY admins_update_memberships ON public.memberships
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY admins_delete_memberships ON public.memberships
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Explicit admin-only write policies for user_roles (prevents privilege escalation)
CREATE POLICY admins_insert_user_roles ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY admins_update_user_roles ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY admins_delete_user_roles ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
