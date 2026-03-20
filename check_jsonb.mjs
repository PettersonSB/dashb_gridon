import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('solar_budgets')
        .select('id, financing_options')
        .order('created_at', { ascending: false })
        .limit(1);
    
    if (error) {
        console.error(error);
    } else {
        console.dir(data[0].financing_options, { depth: null });
    }
}
check();
