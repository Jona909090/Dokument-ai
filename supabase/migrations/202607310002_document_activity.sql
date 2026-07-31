alter table public.documents
  add column if not exists is_favorite boolean not null default false,
  add column if not exists open_count integer not null default 0 check (open_count >= 0),
  add column if not exists last_opened_at timestamptz;

create index if not exists documents_user_favorite_idx
  on public.documents(user_id, is_favorite, updated_at desc);

create index if not exists documents_user_open_count_idx
  on public.documents(user_id, open_count desc);

