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
     * Retorna a lista atualizada de dispositivos.
     */
    async syncDevices() {
        const { data, error } = await supabase.functions.invoke('sync-devices');

        if (error) throw error;
        return data;
    },

    /**
     * Chama a Edge Function que busca dados em tempo real de um dispositivo específico na Tuya.
     */
    async fetchRealtimeData(deviceId: string) {
        const { data, error } = await supabase.functions.invoke('device-status', {
            body: { device_id: deviceId },
        });

        if (error) throw error;
        return data;
    },
};
