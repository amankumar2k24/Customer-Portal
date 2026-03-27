-- Add design_direction column to orders table
ALTER TABLE public.orders ADD COLUMN design_direction TEXT;

-- Update existing orders if any (optional, but good for consistency)
UPDATE public.orders SET design_direction = 'copy_exactly' WHERE design_direction IS NULL;
