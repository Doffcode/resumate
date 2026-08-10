-- Resumate database schema.
--
-- This file is the source of truth for schema changes, per the project's
-- standing rules: no ALTER/CREATE ever runs directly against the live
-- database from an agent session. Changes land here first, get reviewed,
-- then the owner applies them by hand (Supabase SQL editor or `supabase db
-- push`) and confirms before any app code depends on them.
--
-- The base below reflects the ACTUAL live schema of project
-- iznmieztlrytxeujfyci, read back via a real inserted row on 2026-08-10 —
-- not the original design doc, which had drifted from what was really
-- deployed (see resumes.areas / resumes.education_note below).

create table if not exists public.resumes (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  title              text not null default 'Untitled Resume',
  schema_version     int not null default 1,

  personal_info      jsonb not null default '{}',
  education          jsonb not null default '{}',
  internships        jsonb not null default '[]',
  projects           jsonb not null default '[]',
  skills             jsonb not null default '{}',
  positions          jsonb not null default '[]',
  extracurriculars   jsonb not null default '{}',

  section_order      jsonb not null default '[]',
  page_breaks        jsonb not null default '[]',
  section_visibility jsonb not null default '{}',
  layout_settings    jsonb not null default '{}',

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ============================================================================
-- Migration 001 — add the two columns the app needs that were never deployed:
-- Areas of Interest content, and the education table's legend text (e.g.
-- "* - Upto 2nd semester"). Confirmed missing by inserting a real row and
-- reading back every column that came back — this is not a guess.
--
-- Run this by hand in the Supabase SQL editor, then confirm here before any
-- app code is pointed at it.
-- ============================================================================

alter table public.resumes
  add column if not exists areas          jsonb not null default '[]',
  add column if not exists education_note text;
