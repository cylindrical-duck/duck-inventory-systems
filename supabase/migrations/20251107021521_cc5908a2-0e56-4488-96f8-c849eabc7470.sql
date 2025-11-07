-- Add shipping fields to orders table
ALTER TABLE public.orders
ADD COLUMN needs_shipping BOOLEAN DEFAULT false,
ADD COLUMN shipping_address TEXT,
ADD COLUMN recipient_name TEXT,
ADD COLUMN recipient_email TEXT,
ADD COLUMN recipient_phone TEXT;