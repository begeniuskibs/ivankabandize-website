alter table public.resource_downloads
  drop constraint if exists resource_downloads_intended_use_check;

alter table public.resource_downloads
  drop column if exists intended_use;
