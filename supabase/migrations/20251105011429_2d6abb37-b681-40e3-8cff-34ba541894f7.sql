-- Create shipment status enum
CREATE TYPE shipment_status AS ENUM ('scheduled', 'in_transit', 'delivered', 'cancelled');

-- Create transaction type enum
CREATE TYPE transaction_type AS ENUM ('order', 'shipment', 'restock', 'adjustment', 'sample', 'distributor_pickup', 'store_delivery');

-- Create shipments table
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  shipment_number TEXT NOT NULL,
  shipment_type transaction_type NOT NULL DEFAULT 'shipment',
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  shipping_address TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  shipped_date TIMESTAMP WITH TIME ZONE,
  tracking_number TEXT,
  carrier TEXT,
  status shipment_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  custom_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create inventory transactions table
CREATE TABLE public.inventory_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  quantity INTEGER NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for shipments
CREATE POLICY "Users can view company shipments"
ON public.shipments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.company_id = shipments.company_id
  AND profiles.id = auth.uid()
));

CREATE POLICY "Users can insert company shipments"
ON public.shipments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.company_id = shipments.company_id
  AND profiles.id = auth.uid()
));

CREATE POLICY "Users can update company shipments"
ON public.shipments FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.company_id = shipments.company_id
  AND profiles.id = auth.uid()
));

CREATE POLICY "Users can delete company shipments"
ON public.shipments FOR DELETE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.company_id = shipments.company_id
  AND profiles.id = auth.uid()
));

-- RLS policies for inventory transactions
CREATE POLICY "Users can view company transactions"
ON public.inventory_transactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.company_id = inventory_transactions.company_id
  AND profiles.id = auth.uid()
));

CREATE POLICY "Users can insert company transactions"
ON public.inventory_transactions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.company_id = inventory_transactions.company_id
  AND profiles.id = auth.uid()
));

-- Create trigger for shipments updated_at
CREATE TRIGGER update_shipments_updated_at
BEFORE UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_shipments_company_id ON public.shipments(company_id);
CREATE INDEX idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_inventory_transactions_company_id ON public.inventory_transactions(company_id);
CREATE INDEX idx_inventory_transactions_item_id ON public.inventory_transactions(inventory_item_id);