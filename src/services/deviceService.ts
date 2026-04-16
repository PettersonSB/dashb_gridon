import { supabase } from '@/lib/supabase';
import { Device, DeviceLog } from '@/lib/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Helper para obter o token JWT da sessão ativa */
async function getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || ANON_KEY;
}

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
     * Sincroniza os dispositivos com a Tuya via Edge Function.
     * Persiste os dados na tabela `devices` via upsert.
     */
    async syncDevices() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const token = await getAuthToken();

        const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-devices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'apikey': ANON_KEY,
            },
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('sync-devices error:', response.status, errBody);
            throw new Error(`Edge Function retornou ${response.status}`);
        }

        const syncResult = await response.json() as {
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

        // Upsert dos dispositivos na tabela `devices`
        const upsertRows = syncResult.devices.map((d) => ({
            device_id: d.device_id,
            user_id: user.id,
            name: d.name,
            online: String(d.online),
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
     * Busca dados elétricos em tempo real de um dispositivo na Tuya via Edge Function `tuya-token`.
     * Retorna: { voltage, current, power, isOn, online }
     */
    async fetchRealtimeData(deviceId: string) {
        const token = await getAuthToken();

        const response = await fetch(`${SUPABASE_URL}/functions/v1/tuya-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'apikey': ANON_KEY,
            },
            body: JSON.stringify({ device_id: deviceId }),
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`tuya-token error for ${deviceId}:`, response.status, errBody);
            throw new Error(`Edge Function retornou ${response.status}`);
        }

        return await response.json() as {
            etapa: string;
            voltage: number | null;
            current: number | null;
            power: number | null;
            isOn: boolean;
            online: string;
        };
    },

    /**
     * Busca os dados elétricos de TODOS os dispositivos em paralelo,
     * atualiza a tabela `devices` com os valores e retorna os dados.
     */
    async refreshAllDevicesData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // 1. Buscar lista de dispositivos já salvos no banco
        const devices = await this.getDevices();
        if (!devices.length) return [];

        // 2. Buscar dados em tempo real de cada dispositivo (paralelo)
        const results = await Promise.allSettled(
            devices.map(async (device) => {
                const realtime = await this.fetchRealtimeData(device.device_id);

                // 3. Atualizar no banco
                const { error } = await supabase
                    .from('devices')
                    .update({
                        voltage: realtime.voltage,
                        current: realtime.current,
                        power: realtime.power,
                        is_on: realtime.isOn,
                        online: realtime.online === 'online' ? 'true' : 'false',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('device_id', device.device_id);

                if (error) console.error(`Erro ao atualizar ${device.device_id}:`, error);

                return { device_id: device.device_id, ...realtime };
            })
        );

        const successful = results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => (r as PromiseFulfilledResult<any>).value);

        const failed = results.filter((r) => r.status === 'rejected');
        if (failed.length) {
            console.warn(`${failed.length} dispositivo(s) falharam na atualização`);
        }

        return successful;
    },
};
