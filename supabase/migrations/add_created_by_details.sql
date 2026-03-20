-- Add columns to store the creator's name and avatar directly on the budget record
ALTER TABLE solar_budgets ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255);
ALTER TABLE solar_budgets ADD COLUMN IF NOT EXISTS created_by_avatar TEXT;
