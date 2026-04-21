-- Run this in the Supabase SQL Editor for the tiip-crm project
-- https://supabase.com/dashboard/project/vdaqbwbsnkrlkqbjllfa/sql

create table if not exists bcc_emails (
  id                text primary key,
  gmail_message_id  text unique,
  sender_name       text,
  sender_email      text,
  subject           text,
  body_snippet      text,
  received_at       text,
  reviewed          boolean default false,
  created_at        timestamp with time zone default now()
);
