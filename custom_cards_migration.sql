-- Migration: Add custom_cards columns to solar_budgets
ALTER TABLE public.solar_budgets ADD COLUMN IF NOT EXISTS custom_cards JSONB DEFAULT NULL;
ALTER TABLE public.solar_budgets ADD COLUMN IF NOT EXISTS show_custom_cards BOOLEAN DEFAULT false;
