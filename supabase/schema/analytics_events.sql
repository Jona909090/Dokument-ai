-- FUTURE SCHEMA ONLY. This file is not included in the active migrations.
-- Privacy rule: never add document content, form answers or personal data here.

create table if not exists public.analytics_events (
  event_id uuid primary key,
  event_name text not null check (event_name in (
    'document_type_viewed', 'document_started', 'document_completed',
    'document_saved', 'document_exported_pdf', 'document_exported_docx',
    'document_abandoned', 'template_selected', 'category_selected',
    'wizard_step_completed'
  )),
  anonymous_session_id uuid not null,
  user_id uuid null references auth.users(id) on delete set null,
  document_type text not null check (document_type in (
    'cv', 'invoice', 'offer', 'contract', 'request', 'termination',
    'purchase-order', 'minutes', 'certificate', 'business-letter'
  )),
  document_category text not null check (document_category in (
    'construction', 'administration', 'legal', 'finance', 'hr', 'personal'
  )),
  template_id text null check (char_length(template_id) <= 80),
  language text not null check (language in ('hr', 'en')),
  device_type text not null check (device_type in ('desktop', 'tablet', 'mobile')),
  current_step smallint null check (current_step > 0),
  total_steps smallint null check (total_steps > 0),
  duration_seconds integer null check (duration_seconds >= 0),
  created_at timestamptz not null default now(),
  check (current_step is null or total_steps is null or current_step <= total_steps)
);

create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);
create index if not exists analytics_events_name_created_idx on public.analytics_events(event_name, created_at desc);
create index if not exists analytics_events_type_created_idx on public.analytics_events(document_type, created_at desc);
create index if not exists analytics_events_category_created_idx on public.analytics_events(document_category, created_at desc);

comment on table public.analytics_events is 'Privacy-safe product usage events. Must never contain document text, form answers, names, addresses, tax IDs, emails or monetary values.';

alter table public.analytics_events enable row level security;
-- No client policies by design. A future trusted ingestion endpoint should insert events.
