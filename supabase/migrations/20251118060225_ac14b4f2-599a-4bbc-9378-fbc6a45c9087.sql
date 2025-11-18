-- Fix nullable created_by/uploaded_by fields to enforce ownership tracking
-- This prevents RLS policy bypass and ensures proper audit trail

-- First, update any existing NULL values to a system default (if any exist)
-- Using the first admin user as the default owner, or a system UUID if no users exist
DO $$
DECLARE
  system_user_id uuid;
BEGIN
  -- Try to get the first user with admin role, or use a fixed system UUID
  SELECT user_id INTO system_user_id 
  FROM public.user_roles 
  WHERE role = 'admin' 
  LIMIT 1;
  
  -- If no admin exists, use a fixed system UUID (will be NULL for new installs)
  IF system_user_id IS NULL THEN
    system_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- Update NULL created_by fields
  UPDATE public.ai_systems SET created_by = system_user_id WHERE created_by IS NULL;
  UPDATE public.assessments SET created_by = system_user_id WHERE created_by IS NULL;
  UPDATE public.tasks SET created_by = system_user_id WHERE created_by IS NULL;
  UPDATE public.documents SET created_by = system_user_id WHERE created_by IS NULL;
  UPDATE public.evidence SET uploaded_by = system_user_id WHERE uploaded_by IS NULL;
END $$;

-- Now make the columns NOT NULL with DEFAULT auth.uid()
ALTER TABLE public.ai_systems 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE public.assessments 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE public.tasks 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE public.documents 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE public.evidence 
  ALTER COLUMN uploaded_by SET NOT NULL,
  ALTER COLUMN uploaded_by SET DEFAULT auth.uid();