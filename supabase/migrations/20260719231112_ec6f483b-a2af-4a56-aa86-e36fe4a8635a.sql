
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'monthly';

CREATE TABLE public.coaching_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  paypal_order_id TEXT UNIQUE NOT NULL,
  session_type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_email TEXT,
  customer_name TEXT,
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.coaching_orders TO authenticated;
GRANT ALL ON public.coaching_orders TO service_role;

ALTER TABLE public.coaching_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coaching orders"
  ON public.coaching_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE TRIGGER update_coaching_orders_updated_at
  BEFORE UPDATE ON public.coaching_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
