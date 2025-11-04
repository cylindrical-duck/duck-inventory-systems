-- Add custom_data JSONB columns to store extensible field values
ALTER TABLE public.inventory_items
  ADD COLUMN custom_data JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.orders
  ADD COLUMN custom_data JSONB DEFAULT '{}'::jsonb;

-- Create custom_fields table to store field definitions
CREATE TABLE public.custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL CHECK (table_name IN ('inventory_items', 'orders')),
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean')),
  field_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, table_name, field_name)
);

-- Enable RLS
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_fields
CREATE POLICY "Users can view company custom fields"
  ON public.custom_fields FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = custom_fields.company_id
    AND profiles.id = auth.uid()
  ));

CREATE POLICY "Users can insert company custom fields"
  ON public.custom_fields FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = custom_fields.company_id
    AND profiles.id = auth.uid()
  ));

CREATE POLICY "Users can update company custom fields"
  ON public.custom_fields FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = custom_fields.company_id
    AND profiles.id = auth.uid()
  ));

CREATE POLICY "Users can delete company custom fields"
  ON public.custom_fields FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = custom_fields.company_id
    AND profiles.id = auth.uid()
  ));