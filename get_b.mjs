import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'd:/site_energia_solar/solar-shine-web/gridon-dashboard/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
    const { data } = await supabase.from('solar_budgets').select('id').order('created_at', {ascending: false}).limit(1);
    console.log("BUDGET_ID=" + data[0].id);
}
main();
