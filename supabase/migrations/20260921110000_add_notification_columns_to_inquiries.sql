-- Add notification status tracking columns to public.inquiries (Safe additive migration)

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notify_error TEXT;
