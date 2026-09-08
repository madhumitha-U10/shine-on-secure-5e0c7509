CREATE POLICY "Signed-in users can upload their own media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('seller-avatars', 'product-images', 'story-images')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Signed-in users can read their own media"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('seller-avatars', 'product-images', 'story-images')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Signed-in users can update their own media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('seller-avatars', 'product-images', 'story-images')
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id IN ('seller-avatars', 'product-images', 'story-images')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Signed-in users can delete their own media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('seller-avatars', 'product-images', 'story-images')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );