import { supabase } from '@/lib/supabase';
import { Device, DeviceLog } from '@/lib/types';

export const deviceService = {

    /** Busca todos os dispositivos (última leitura / cache) */
    async getDevices() {
        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data as Device[];
    },

    /** Busca um dispositivo pelo UUID interno */
    async getDevice(id: string) {
        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Device;
    },

    /** Atualiza o nome de um dispositivo */
    async updateDeviceName(id: string, name: string) {
        const { data, error } = await supabase
            .from('devices')
            .update({ name })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Device;
    },

    /** Remove um dispositivo */
    async deleteDevice(id: string) {
        const { error } = await supabase
            .from('devices')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Busca o histórico de logs de um dispositivo.
     * Por padrão retorna as últimas 100 entradas.
     */
    async getDeviceLogs(deviceId: string, limit = 100) {
        const { data, error } = await supabase
            .from('device_logs')
            .select('*')
            .eq('device_id', deviceId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data as DeviceLog[];
    },

    /**
     * Chama a Edge Function do Supabase que sincroniza os dispositivos com a Tuya.
     * Após receber a resposta, faz upsert na tabela `devices` para persistir os dados.
     * Retorna a lista atualizada de dispositivos.
     */
    async syncDevices() {
        // 1. Obter o user_id e sessão do usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: { session } } = await supabase.auth.getSession();

        // 2. Chamar a Edge Function via fetch direto com token JWT
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/sync-devices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || anonKey}`,
                'apikey': anonKey,
            },
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('Edge Function error:', response.status, errBody);
            throw new Error(`Edge Function retornou ${response.status}`);
        }

        const data = await response.json();
        const error = null;
        if (error) throw error;

        // A resposta da Edge Function tem o formato:
        // { etapa: "SUCESSO", total: 2, devices: [{ device_id, name, online }, ...] }
        const syncResult = data as {
            etapa: string;
            total: number;
            devices: Array<{
                device_id: string;
                name: string;
                online: boolean;
            }>;
        };

        if (!syncResult?.devices?.length) {
            return syncResult;
        }

        // 3. Upsert dos dispositivos na tabela `devices`
        const upsertRows = syncResult.devices.map((d) => ({
            device_id: d.device_id,
            user_id: user.id,
            name: d.name,
            online: String(d.online), // converter boolean → string "true"/"false"
            updated_at: new Date().toISOString(),
        }));

        const { error: upsertError } = await supabase
            .from('devices')
            .upsert(upsertRows, { onConflict: 'device_id' });

        if (upsertError) {
            console.error('Erro ao salvar dispositivos:', upsertError);
            throw upsertError;
        }

        return syncResult;
    },

    /**
     * Chama a Edge Function tuya-token para buscar dados em tempo real 
     * de um dispositivo específico na Tuya.
     */
    async fetchRealtimeData(deviceId: string) {
        const { data, error } = await supabase.functions.invoke('tuya-token', {
            body: { device_id: deviceId },
        });

        if (error) throw error;
        return data;
    },
};
