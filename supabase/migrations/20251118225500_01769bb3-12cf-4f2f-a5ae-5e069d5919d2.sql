-- Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false);

-- RLS policies for evidence bucket
CREATE POLICY "Authenticated users can view evidence files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'evidence');

CREATE POLICY "Authenticated users can upload evidence files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own evidence files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can delete evidence files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidence' AND 
  (has_role(auth.uid(), 'admin'::user_role) OR auth.uid()::text = (storage.foldername(name))[1])
);