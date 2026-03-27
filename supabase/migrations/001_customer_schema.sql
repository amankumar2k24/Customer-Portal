CREATE TYPE user_type AS ENUM ('customer', 'campus_rep', 'account_manager');
CREATE TYPE order_status AS ENUM ('new', 'proof_pending', 'proof_ready', 'approved', 'in_production', 'shipped', 'complete');
CREATE TYPE print_type AS ENUM ('screen_print', 'embroidery', 'puff_print', 'foil', 'dye_sublimation');
CREATE TYPE proof_status AS ENUM ('pending', 'approved', 'revision_requested');


CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  user_type user_type DEFAULT 'customer',
  organization TEXT,
  school TEXT,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  turnaround_days INTEGER NOT NULL,
  starting_price DECIMAL(10,2) NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  print_types_available print_type[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event_name TEXT NOT NULL,
  due_date DATE NOT NULL,
  status order_status DEFAULT 'new',
  order_type TEXT NOT NULL,
  products_selected JSONB NOT NULL,
  print_type print_type NOT NULL,
  front_design_description TEXT,
  back_design_description TEXT,
  front_design_file TEXT,
  back_design_file TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  proof_number INTEGER NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  color TEXT NOT NULL,
  print_type print_type NOT NULL,
  est_ship_date DATE,
  price_tiers JSONB NOT NULL,
  mockup_image_url TEXT,
  status proof_status DEFAULT 'pending',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.revision_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_id UUID REFERENCES public.proofs(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);


CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);


CREATE POLICY "Customers can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can insert their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update their own orders" ON public.orders FOR UPDATE USING (auth.uid() = customer_id);


CREATE POLICY "Customers can view proofs for their orders" ON public.proofs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE public.orders.id = order_id AND public.orders.customer_id = auth.uid())
);
CREATE POLICY "Customers can update their own proofs" ON public.proofs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.orders WHERE public.orders.id = order_id AND public.orders.customer_id = auth.uid())
);


CREATE POLICY "Customers can insert revision requests for their proofs" ON public.revision_requests FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can view their own revision requests" ON public.revision_requests FOR SELECT USING (auth.uid() = customer_id);


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, user_type)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Customer'), new.email, 'customer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();