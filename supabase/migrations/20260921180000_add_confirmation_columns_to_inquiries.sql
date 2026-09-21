-- Add confirmation email tracking columns to public.inquiries (Safe additive migration)

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmation_error TEXT;
