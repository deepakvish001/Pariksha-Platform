insert into storage.buckets (id, name, public)
values ('problem-assets', 'problem-assets', true)
on conflict (id) do update set public = true;

create policy "problem-assets public read"
on storage.objects for select
using (bucket_id = 'problem-assets');

create policy "problem-assets admin insert"
on storage.objects for insert
with check (bucket_id = 'problem-assets' and public.has_role(auth.uid(), 'admin'));

create policy "problem-assets admin update"
on storage.objects for update
using (bucket_id = 'problem-assets' and public.has_role(auth.uid(), 'admin'));

create policy "problem-assets admin delete"
on storage.objects for delete
using (bucket_id = 'problem-assets' and public.has_role(auth.uid(), 'admin'));