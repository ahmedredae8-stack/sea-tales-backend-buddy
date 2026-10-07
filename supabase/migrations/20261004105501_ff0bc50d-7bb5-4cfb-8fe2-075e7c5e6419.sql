DROP POLICY "admins read artwork files" ON storage.objects;
CREATE POLICY "signed in players view artwork files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'game-artwork');