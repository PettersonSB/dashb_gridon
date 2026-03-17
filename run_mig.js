import { execSync } from 'child_process';

try {
  // Use direct port 5432 and host db.ncknuhgrmdypxmsqeyys.supabase.co instead of the 6543 pooler
  const dbUrl = "postgresql://postgres:pSSt%26D0k2VvWf5tN@db.ncknuhgrmdypxmsqeyys.supabase.co:5432/postgres";
  console.log("Starting migration with direct database connection...");
  
  execSync(`npx supabase migration up --db-url "${dbUrl}"`, {
    stdio: 'inherit',
    shell: true
  });
} catch (err) {
  console.error("Exec failed.", err);
}
