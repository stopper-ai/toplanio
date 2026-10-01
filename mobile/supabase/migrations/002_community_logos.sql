begin;
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('community-logos', 'community-logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']);

create policy toplanio_logo_insert_own_folder on storage.objects
for insert to authenticated with check (
  bucket_id = 'community-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy toplanio_logo_select_own_folder on storage.objects
for select to authenticated using (
  bucket_id = 'community-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy toplanio_logo_delete_own_folder on storage.objects
for delete to authenticated using (
  bucket_id = 'community-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
commit;
