import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDate() {
    const { data: logs, error: lErr } = await supabase.from('device_logs').select('created_at').order('created_at', { ascending: false }).limit(2);
    const { data: devs, error: dErr } = await supabase.from('devices').select('updated_at').limit(2);
    
    console.log("LOGS:");
    console.log(logs);
    console.log("DEVICES:");
    console.log(devs);
}

checkDate();
