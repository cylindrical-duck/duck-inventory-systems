-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create profiles table to link users to companies
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add company_id to inventory_items and orders (nullable first for existing data)
ALTER TABLE public.inventory_items 
  ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.orders 
  ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- RLS Policies for companies
CREATE POLICY "Users can view their own company"
  ON public.companies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = companies.id
    AND profiles.id = auth.uid()
  ));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Update RLS Policies for inventory_items to use company_id
DROP POLICY "Users can view their own inventory items" ON public.inventory_items;
DROP POLICY "Users can insert their own inventory items" ON public.inventory_items;
DROP POLICY "Users can update their own inventory items" ON public.inventory_items;
DROP POLICY "Users can delete their own inventory items" ON public.inventory_items;

CREATE POLICY "Users can view company inventory items"
  ON public.inventory_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = inventory_items.company_id
    AND profiles.id = auth.uid()
  ));

CREATE POLICY "Users can insert company inventory items"
  ON public.inventory_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = inventory_items.company_id
    AND profiles.id = auth.uid()
  ));

CREATE POLICY "Users can update company inventory items"
  ON public.inventory_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = inventory_items.company_id
    AND profiles.id = auth.uid()
  ));

CREATE POLICY "Users can delete company inventory items"
  ON public.inventory_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = inventory_items.company_id
    AND profiles.id = auth.uid()
  ));

-- Update RLS Policies for orders to use company_id
DROP POLICY "Users can view their own orders" ON public.orders;
DROP POLICY "Users can insert their own orders" ON public.orders;
DROP POLICY "Users can update their own orders" ON public.orders;
DROP POLICY "Users can delete their own orders" ON public.orders;

CREATE POLICY "Users can view company orders"
  ON public.orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = orders.company_id
    AND profiles.id = auth.uid()
  ));

CREATE POLICY "Users can insert company orders"
  ON public.orders FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = orders.company_id
    AND profiles.id = auth.uid()
  ));

CREATE POLICY "Users can update company orders"
  ON public.orders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = orders.company_id
    AND profiles.id = auth.uid()
  ));

CREATE POLICY "Users can delete company orders"
  ON public.orders FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = orders.company_id
    AND profiles.id = auth.uid()
  ));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  company_uuid UUID;
  company_name_val TEXT;
  company_domain_val TEXT;
BEGIN
  -- Get company info from metadata
  company_name_val := NEW.raw_user_meta_data->>'company_name';
  company_domain_val := NEW.raw_user_meta_data->>'company_domain';

  -- Check if company exists
  SELECT id INTO company_uuid
  FROM public.companies
  WHERE domain = company_domain_val;

  -- If company doesn't exist, create it
  IF company_uuid IS NULL THEN
    INSERT INTO public.companies (name, domain)
    VALUES (company_name_val, company_domain_val)
    RETURNING id INTO company_uuid;
  END IF;

  -- Create profile for user
  INSERT INTO public.profiles (id, company_id)
  VALUES (NEW.id, company_uuid);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();