-- Add audio_url column to store the explanatory audio recording URL
ALTER TABLE solar_budgets ADD COLUMN IF NOT EXISTS audio_url TEXT;
