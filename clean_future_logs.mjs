import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const getBrasiliaTimestamp = () => new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
}).format(new Date()).replace(' ', 'T');

async function fixFutureLogs() {
    console.log("Horario de Brasilia agora:", getBrasiliaTimestamp());
    
    // Deleta os logs que estao alem de 10 minutos no futuro (pra dar folga se houver mili-segundos de diferença)
    const futureLimit = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(new Date(Date.now() + 5*60000)).replace(' ', 'T');

    console.log("Removendo logs maiores que:", futureLimit);

    const { data, error } = await supabase
        .from('device_logs')
        .delete()
        .gt('created_at', futureLimit);

    if (error) {
        console.error("Erro ao limpar dados do futuro:", error);
    } else {
        console.log("Limpeza concluída com sucesso.");
    }
}

fixFutureLogs();
