create policy "Team reads report photos" on storage.objects for select to authenticated
  using (bucket_id = 'report-photos' and public.is_team(auth.uid()));