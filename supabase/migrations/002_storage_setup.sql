INSERT INTO storage.buckets (id, name, public) 
VALUES ('designs', 'designs', true)
ON CONFLICT (id) DO NOTHING;


CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'designs');


CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'designs' AND auth.role() = 'authenticated'
);