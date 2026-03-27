INSERT INTO public.products (sku, name, category, turnaround_days, starting_price, is_featured, print_types_available) VALUES
('TEE-GILDAN-64000', 'Gildan Softstyle Tee', 'T-Shirts', 10, 8.50, true, ARRAY['screen_print', 'puff_print', 'foil']::print_type[]),
('TEE-BELLA-3001', 'Bella+Canvas Unisex Tee', 'T-Shirts', 10, 11.00, true, ARRAY['screen_print', 'dye_sublimation', 'foil']::print_type[]),
('CREW-INDEPENDENT-SS3000', 'Independent Trading Crewneck', 'Sweatshirts', 12, 22.00, true, ARRAY['screen_print', 'embroidery', 'puff_print']::print_type[]),
('HOOD-GILDAN-18500', 'Gildan Heavy Blend Hoodie', 'Sweatshirts', 12, 24.00, true, ARRAY['screen_print', 'embroidery', 'puff_print']::print_type[]),
('HAT-RICHARDSON-112', 'Richardson 112 Trucker Hat', 'Headwear', 14, 18.00, false, ARRAY['embroidery', 'puff_print']::print_type[]),
('HAT-YUPOONG-6606', 'Yupoong Snapback', 'Headwear', 14, 16.00, false, ARRAY['embroidery', 'screen_print']::print_type[]),
('POLO-PORT-K500', 'Port Authority Performance Polo', 'Polos', 14, 28.00, false, ARRAY['embroidery', 'screen_print']::print_type[]),
('JACKET-CHARLES-J317', 'Charles River Pullover Jacket', 'Outerwear', 18, 45.00, false, ARRAY['embroidery', 'screen_print']::print_type[]),
('TANK-NEXT-3633', 'Next Level Racerback Tank', 'T-Shirts', 10, 9.00, false, ARRAY['screen_print', 'dye_sublimation']::print_type[]),
('CREW-COMFORT-1566', 'Comfort Colors Crewneck', 'Sweatshirts', 12, 26.00, true, ARRAY['screen_print', 'embroidery']::print_type[]);