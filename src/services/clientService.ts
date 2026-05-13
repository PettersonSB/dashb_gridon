import { supabase } from '@/lib/supabase';

// ── Tipos ──────────────────────────────────────────

export interface ClientAccount {
    id: string;
    user_id: string;
    full_name: string;
    phone: string | null;
    email: string;
    energy_tariff: number;
    status: 'ativo' | 'suspenso' | 'desativado';
    must_change_password: boolean;
    last_login_at: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface ClientInstallation {
    id: string;
    client_user_id: string;
    cep: string | null;
    address: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    latitude: number | null;
    longitude: number | null;
    system_power_kwp: number | null;
    module_count: number | null;
    module_power_w: number | null;
    module_model: string | null;
    inverter_model: string | null;
    inverter_type: string | null;
    installation_date: string | null;
    installation_photo_url: string | null;
    notes: string | null;
    created_at: string;
}

export interface EnergyBill {
    id: string;
    client_user_id: string;
    reference_month: string;
    due_date: string | null;
    total_value: number | null;
    injected_credits_kwh: number | null;
    grid_consumption_kwh: number | null;
    savings: number | null;
    pdf_url: string | null;
    notes: string | null;
    uploaded_by: string | null;
    created_at: string;
}

export interface SupportTicket {
    id: string;
    client_user_id: string;
    subject: string;
    description: string | null;
    status: string;
    priority: string;
    admin_response: string | null;
    responded_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateClientPayload {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    energy_tariff: number;
    installation?: {
        cep?: string;
        address?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        latitude?: number;
        longitude?: number;
        system_power_kwp?: number;
        module_count?: number;
        module_power_w?: number;
        module_model?: string;
        inverter_model?: string;
        inverter_type?: string;
        installation_date?: string;
        installation_photo_url?: string;
        notes?: string;
    };
    device_ids?: string[];
}

// ── Service ────────────────────────────────────────

export const clientService = {

    // ── Clientes ──────────────────────────────────

    /** Lista todos os clientes cadastrados */
    async getClients(): Promise<ClientAccount[]> {
        const { data, error } = await supabase
            .from('client_accounts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /** Busca um cliente pelo user_id */
    async getClient(userId: string): Promise<ClientAccount> {
        const { data, error } = await supabase
            .from('client_accounts')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    /** Atualiza dados de um cliente */
    async updateClient(userId: string, updates: Partial<ClientAccount>): Promise<void> {
        const { error } = await supabase
            .from('client_accounts')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('user_id', userId);

        if (error) throw error;
    },

    // ── Criar Cliente (via Edge Function) ─────────

    /** Cria um novo cliente chamando a Edge Function create-client-account */
    async createClient(payload: CreateClientPayload): Promise<{ user_id: string; email: string }> {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
            throw new Error('Você precisa estar logado para criar um cliente. Faça login novamente.');
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/create-client-account`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'apikey': ANON_KEY,
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        let result: any;
        try {
            result = JSON.parse(responseText);
        } catch {
            throw new Error(`Erro inesperado do servidor (${response.status}): ${responseText}`);
        }

        if (!response.ok) {
            throw new Error(result.error || result.message || `Erro ao criar cliente (${response.status})`);
        }

        return result;
    },

    // ── Gerenciar Status (via Edge Function) ──────

    /** Altera o status de um cliente (suspender, ativar, desativar, resetar senha, deletar) */
    async manageClient(action: 'suspend' | 'activate' | 'deactivate' | 'reset_password' | 'delete', clientUserId: string, newPassword?: string): Promise<{ message: string }> {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
            throw new Error('Você precisa estar logado. Faça login novamente.');
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/manage-client-account`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'apikey': ANON_KEY,
            },
            body: JSON.stringify({
                action,
                client_user_id: clientUserId,
                ...(newPassword ? { new_password: newPassword } : {}),
            }),
        });

        const responseText = await response.text();
        let result: any;
        try {
            result = JSON.parse(responseText);
        } catch {
            throw new Error(`Erro inesperado do servidor (${response.status}): ${responseText}`);
        }

        if (!response.ok) {
            throw new Error(result.error || result.message || `Erro na operação (${response.status})`);
        }

        return result;
    },

    // ── Instalação ─────────────────────────────────

    /** Busca a instalação de um cliente */
    async getInstallation(clientUserId: string): Promise<ClientInstallation | null> {
        const { data, error } = await supabase
            .from('client_installations')
            .select('*')
            .eq('client_user_id', clientUserId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    /** Atualiza a instalação de um cliente */
    async updateInstallation(clientUserId: string, updates: Partial<ClientInstallation>): Promise<void> {
        const payload: any = { ...updates, client_user_id: clientUserId };
        // Garante que campos undefined se tornem null para o banco
        if (updates.cep === undefined) payload.cep = updates.cep;
        if (updates.neighborhood === undefined) payload.neighborhood = updates.neighborhood;
        if (updates.latitude === undefined) payload.latitude = updates.latitude;
        if (updates.longitude === undefined) payload.longitude = updates.longitude;
        if (updates.module_power_w === undefined) payload.module_power_w = updates.module_power_w;
        if (updates.inverter_type === undefined) payload.inverter_type = updates.inverter_type;
        if (updates.installation_photo_url === undefined) payload.installation_photo_url = updates.installation_photo_url;

        const { error } = await supabase
            .from('client_installations')
            .upsert(payload, { onConflict: 'client_user_id' });

        if (error) throw error;
    },

    // ── Dispositivos ───────────────────────────────

    /** Lista os dispositivos vinculados a um cliente */
    async getClientDevices(clientUserId: string) {
        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .eq('client_user_id', clientUserId)
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /** Lista dispositivos disponíveis (sem cliente vinculado) */
    async getAvailableDevices() {
        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .is('client_user_id', null)
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /** Vincula um dispositivo a um cliente */
    async linkDevice(deviceId: string, clientUserId: string): Promise<void> {
        const { error } = await supabase
            .from('devices')
            .update({ client_user_id: clientUserId })
            .eq('device_id', deviceId);

        if (error) throw error;
    },

    /** Desvincula um dispositivo de um cliente */
    async unlinkDevice(deviceId: string): Promise<void> {
        const { error } = await supabase
            .from('devices')
            .update({ client_user_id: null })
            .eq('device_id', deviceId);

        if (error) throw error;
    },

    // ── Contas de Energia ──────────────────────────

    /** Lista as contas de energia de um cliente */
    async getBills(clientUserId: string): Promise<EnergyBill[]> {
        const { data, error } = await supabase
            .from('energy_bills')
            .select('*')
            .eq('client_user_id', clientUserId)
            .order('reference_month', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /** Cria/atualiza uma conta de energia */
    async upsertBill(bill: Partial<EnergyBill> & { client_user_id: string; reference_month: string }): Promise<void> {
        const { error } = await supabase
            .from('energy_bills')
            .upsert(bill, { onConflict: 'client_user_id,reference_month' });

        if (error) throw error;
    },

    /** Faz upload do PDF da conta de energia */
    async uploadBillPdf(clientUserId: string, referenceMonth: string, file: File): Promise<string> {
        const filePath = `${clientUserId}/${referenceMonth}.pdf`;

        const { error: uploadError } = await supabase.storage
            .from('energy_bills')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('energy_bills')
            .getPublicUrl(filePath);

        return publicUrl;
    },

    /** Deleta uma conta de energia */
    async deleteBill(billId: string): Promise<void> {
        const { error } = await supabase
            .from('energy_bills')
            .delete()
            .eq('id', billId);

        if (error) throw error;
    },

    // ── Chamados de Suporte ────────────────────────

    /** Lista os chamados de um cliente */
    async getTickets(clientUserId: string): Promise<SupportTicket[]> {
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('client_user_id', clientUserId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /** Responde a um chamado */
    async respondTicket(ticketId: string, response: string): Promise<void> {
        const { error } = await supabase
            .from('support_tickets')
            .update({
                admin_response: response,
                status: 'resolvido',
                responded_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', ticketId);

        if (error) throw error;
    },
};
