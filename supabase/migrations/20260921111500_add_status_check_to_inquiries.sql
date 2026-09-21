-- Add status check constraint to public.inquiries

ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_status_check
  CHECK (status IN ('new', 'replied', 'closed'));
