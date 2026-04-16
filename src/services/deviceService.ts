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

                // 3. Atualizar no banco (tabela devices — valores atuais)
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

                // 4. Gravar snapshot no histórico (tabela device_logs)
                if (realtime.voltage != null || realtime.current != null || realtime.power != null) {
                    const { error: logError } = await supabase
                        .from('device_logs')
                        .insert({
                            device_id: device.device_id,
                            user_id: user.id,
                            voltage: realtime.voltage,
                            current: realtime.current,
                            power: realtime.power,
                        });

                    if (logError) console.warn(`Erro ao gravar log de ${device.device_id}:`, logError);
                }

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

    /**
     * Busca o histórico de um dispositivo usando a estratégia de 2 camadas:
     * - day/week  → device_logs (dados brutos a cada 5 min)
     * - month     → device_daily_summary (resumos diários)
     * - year      → device_monthly_summary (resumos mensais)
     */
    async getDeviceHistory(deviceId: string, range: 'day' | 'week' | 'month' | 'year', offset = 0) {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        switch (range) {
            case 'day':
                endDate = new Date(now);
                endDate.setDate(endDate.getDate() - offset);
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 1);
                break;
            case 'week':
                endDate = new Date(now);
                endDate.setDate(endDate.getDate() - (offset * 7));
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                endDate = new Date(now);
                endDate.setMonth(endDate.getMonth() - offset);
                startDate = new Date(endDate);
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'year':
                endDate = new Date(now);
                endDate.setFullYear(endDate.getFullYear() - offset);
                startDate = new Date(endDate);
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
        }

        // Camada 1: Dados brutos (dia e semana)
        if (range === 'day' || range === 'week') {
            const { data, error } = await supabase
                .from('device_logs')
                .select('*')
                .eq('device_id', deviceId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: true });

            if (error) throw error;
            return { logs: data as DeviceLog[], startDate, endDate };
        }

        // Camada 2: Resumo diário (mês)
        if (range === 'month') {
            const { data, error } = await supabase
                .from('device_daily_summary')
                .select('*')
                .eq('device_id', deviceId)
                .gte('date', startDate.toISOString().split('T')[0])
                .lte('date', endDate.toISOString().split('T')[0])
                .order('date', { ascending: true });

            if (error) throw error;

            // Converte para formato compatível com DeviceLog
            const logs = (data || []).map((d: any) => ({
                id: d.id,
                device_id: d.device_id,
                user_id: '',
                voltage: d.avg_voltage,
                current: d.avg_current,
                power: d.avg_power,
                created_at: `${d.date}T12:00:00Z`,
            })) as DeviceLog[];

            return { logs, startDate, endDate };
        }

        // Camada 3: Resumo mensal (ano)
        const { data, error } = await supabase
            .from('device_monthly_summary')
            .select('*')
            .eq('device_id', deviceId)
            .order('year_month', { ascending: true });

        if (error) throw error;

        // Filtrar pelo range de datas e converter
        const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;

        const filteredData = (data || []).filter((d: any) => d.year_month >= startStr && d.year_month <= endStr);

        const logs = filteredData.map((d: any) => ({
            id: d.id,
            device_id: d.device_id,
            user_id: '',
            voltage: d.avg_voltage,
            current: d.avg_current,
            power: d.avg_power,
            created_at: `${d.year_month}-15T12:00:00Z`,
        })) as DeviceLog[];

        return { logs, startDate, endDate };
    },

    /**
     * Altera o intervalo do cron de coleta via RPC no banco.
     * @param cronExpression ex: '*/5 * * * *' para 5 min
     */
    async updateRefreshInterval(cronExpression: string) {
        const { error } = await supabase.rpc('update_device_refresh_interval', {
            new_cron: cronExpression,
        });
        if (error) throw error;
    },
};

