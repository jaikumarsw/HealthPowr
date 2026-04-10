-- Migration: create profiles table
-- Run this in your Supabase SQL editor or via psql connected to your Supabase database.

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  name text,
  role text,
  organization text,
  avatar text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
