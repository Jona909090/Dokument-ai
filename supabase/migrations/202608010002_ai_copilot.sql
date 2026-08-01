-- Dokument AI Copilot: metadata only. Prompts and private document content are intentionally excluded.
create table public.ai_organization_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  enabled boolean not null default true,
  allowed_actions text[] not null default array['classify','extract','draft','rewrite','translate','validate','summarize','email','convert'],
  allowed_languages text[] not null default array['hr','sr-Latn','sr-Cyrl','bs','cnr','en','de','it','sl'],
  monthly_credit_limit integer not null default 30 check (monthly_credit_limit >= 0),
  allow_contact_context boolean not null default false,
  allow_project_context boolean not null default false,
  require_financial_confirmation boolean not null default true,
  require_legal_confirmation boolean not null default true,
  updated_by uuid references auth.users(id), updated_at timestamptz not null default now()
);

create table public.ai_requests (
  id uuid primary key default gen_random_uuid(), organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, document_id uuid references public.documents(id) on delete set null,
  idempotency_key text not null, action text not null, provider text not null, model text not null, status text not null,
  safe_metadata jsonb not null default '{}'::jsonb, input_token_count integer not null default 0, output_token_count integer not null default 0,
  credits_used integer not null default 0, duration_ms integer, error_code text, created_at timestamptz not null default now(), completed_at timestamptz,
  unique(user_id,idempotency_key)
);

create table public.ai_document_changes (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, document_id uuid not null references public.documents(id) on delete cascade,
  ai_request_id uuid references public.ai_requests(id) on delete set null, action text not null, decision text not null check(decision in('accepted','rejected','partially_accepted','undone')),
  changed_field_keys text[] not null default '{}', before_version integer, after_version integer, created_at timestamptz not null default now()
);

create table public.ai_usage_monthly (
  organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null, credits_used integer not null default 0, request_count integer not null default 0,
  primary key(organization_id,user_id,period_start)
);

create index ai_requests_org_created_idx on public.ai_requests(organization_id,created_at desc);
create index ai_requests_action_status_idx on public.ai_requests(action,status,created_at desc);
alter table public.ai_organization_settings enable row level security;
alter table public.ai_requests enable row level security;
alter table public.ai_document_changes enable row level security;
alter table public.ai_usage_monthly enable row level security;
grant select,insert,update,delete on public.ai_organization_settings,public.ai_requests,public.ai_document_changes,public.ai_usage_monthly to authenticated;
create policy ai_settings_read on public.ai_organization_settings for select to authenticated using(public.is_org_member(organization_id));
create policy ai_settings_manage on public.ai_organization_settings for all to authenticated using(public.has_org_role(organization_id,array['owner','admin']::public.organization_role[])) with check(public.has_org_role(organization_id,array['owner','admin']::public.organization_role[]));
create policy ai_requests_own_read on public.ai_requests for select to authenticated using(user_id=(select auth.uid()) or public.has_org_role(organization_id,array['owner','admin']::public.organization_role[]));
create policy ai_requests_own_insert on public.ai_requests for insert to authenticated with check(user_id=(select auth.uid()) and (organization_id is null or public.is_org_member(organization_id)));
create policy ai_changes_member_read on public.ai_document_changes for select to authenticated using(public.is_org_member(organization_id));
create policy ai_changes_own_insert on public.ai_document_changes for insert to authenticated with check(user_id=(select auth.uid()) and public.is_org_member(organization_id));
create policy ai_usage_read on public.ai_usage_monthly for select to authenticated using(user_id=(select auth.uid()) or public.has_org_role(organization_id,array['owner','admin']::public.organization_role[]));

