alter table public.resource_downloads
  add column if not exists intended_use text;

alter table public.resource_downloads
  drop constraint if exists resource_downloads_intended_use_check;

alter table public.resource_downloads
  add constraint resource_downloads_intended_use_check
  check (intended_use is null or intended_use in ('myself', 'team', 'church_ministry', 'curious'));
