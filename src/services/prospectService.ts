import { supabase } from '@/lib/supabase';
import { Prospect } from '@/lib/types';

export const prospectService = {
  /**
   * Busca todos os prospects, opcionalmente incluindo a contagem de orçamentos gerados
   */
  async getProspects(): Promise<Prospect[]> {
    // Busca prospects
    const { data: prospects, error } = await supabase
      .from('prospects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar prospects:', error);
      throw error;
    }

    // Busca a contagem de orçamentos para cada prospect (manual aggregation)
    if (prospects && prospects.length > 0) {
      const { data: budgets, error: budgetsError } = await supabase
        .from('solar_budgets')
        .select('prospect_id');

      if (!budgetsError && budgets) {
        // Conta a ocorrência de cada prospect_id
        const counts = budgets.reduce((acc: any, budget: any) => {
          if (budget.prospect_id) {
            acc[budget.prospect_id] = (acc[budget.prospect_id] || 0) + 1;
          }
          return acc;
        }, {});

        // Associa a contagem ao prospect
        return prospects.map(p => ({
          ...p,
          budgets_count: counts[p.id] || 0
        }));
      }
    }

    return prospects || [];
  },

  /**
   * Cria um novo prospect
   */
  async createProspect(prospect: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>): Promise<Prospect> {
    const normalizedPhone = prospect.phone.replace(/\D/g, '');
    const { data, error } = await supabase
      .from('prospects')
      .insert({ ...prospect, phone: normalizedPhone })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar prospect:', error);
      throw error;
    }

    return data;
  },

  /**
   * Atualiza um prospect existente
   */
  async updateProspect(id: string, updates: Partial<Prospect>): Promise<Prospect> {
    const cleanUpdates = { ...updates };
    if (updates.phone) {
      cleanUpdates.phone = updates.phone.replace(/\D/g, '');
    }
    
    const { data, error } = await supabase
      .from('prospects')
      .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar prospect:', error);
      throw error;
    }

    return data;
  },

  /**
   * Deleta um prospect
   */
  async deleteProspect(id: string): Promise<void> {
    const { error } = await supabase
      .from('prospects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar prospect:', error);
      throw error;
    }
  },

  /**
   * Busca um prospect por telefone (útil para descobrir se já existe)
   */
  async findProspectByPhone(phone: string): Promise<Prospect | null> {
    // Normaliza o telefone para garantir uma busca melhor (remove caracteres não numéricos)
    const normalizedPhone = phone.replace(/\D/g, '');
    if (!normalizedPhone) return null;
    
    // Busca exata pelo telefone normalizado
    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('phone', normalizedPhone)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar prospect por telefone:', error);
      return null;
    }

    return data;
  }
};
