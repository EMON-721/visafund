UPDATE storage.buckets SET public=false,file_size_limit=10485760,allowed_mime_types=ARRAY['application/pdf','image/png','image/jpeg','text/csv'] WHERE id='visafund-documents';
CREATE POLICY visafund_backend_only ON storage.objects AS RESTRICTIVE FOR ALL TO anon, authenticated USING (bucket_id <> 'visafund-documents') WITH CHECK (bucket_id <> 'visafund-documents');
