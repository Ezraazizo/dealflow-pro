-- Migration: Add multi-address support to deals
-- Run this in Supabase SQL Editor

-- Add addresses column (JSONB array to store multiple addresses with BBL data)
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS addresses jsonb DEFAULT '[]'::jsonb;

-- Add BBL-related columns for quick access to primary property
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS bbl text,
ADD COLUMN IF NOT EXISTS borough text,
ADD COLUMN IF NOT EXISTS block text,
ADD COLUMN IF NOT EXISTS lot text;

-- Create index for BBL lookups
CREATE INDEX IF NOT EXISTS idx_deals_bbl ON public.deals(bbl);

-- Comment explaining the addresses structure
COMMENT ON COLUMN public.deals.addresses IS 'Array of address objects: [{label, address, bbl, borough, block, lot, bin, coordinates}]';

-- ─── CALENDAR EVENTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  title text NOT NULL,
  date date NOT NULL,
  time time,
  type text DEFAULT 'other' CHECK (type IN ('deadline', 'inspection', 'closing', 'meeting', 'due_diligence', 'financing', 'legal', 'other')),
  notes text,
  reminder boolean DEFAULT true,
  is_done boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view calendar events"
  ON public.calendar_events FOR SELECT
  USING (deal_id IN (SELECT id FROM public.deals WHERE org_id IN (
    SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
  )));

CREATE POLICY "Org members can manage calendar events"
  ON public.calendar_events FOR ALL
  USING (deal_id IN (SELECT id FROM public.deals WHERE org_id IN (
    SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
  )));

CREATE INDEX IF NOT EXISTS idx_calendar_events_deal_id ON public.calendar_events(deal_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(date);
