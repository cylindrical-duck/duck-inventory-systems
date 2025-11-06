-- Add price field to inventory_items
ALTER TABLE inventory_items ADD COLUMN price NUMERIC DEFAULT 0;

-- Add inventory_item_id to order_items to link them properly
ALTER TABLE order_items ADD COLUMN inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_order_items_inventory_item_id ON order_items(inventory_item_id);