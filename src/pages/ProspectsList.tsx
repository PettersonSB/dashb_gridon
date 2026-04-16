import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Users, Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, 
    Calendar, DollarSign, Loader2, ArrowRight, Receipt
} from 'lucide-react';
import { prospectService } from '@/services/prospectService';
import { Prospect } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

function formatPhone(phone: string) {
    if (!phone) return '';
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
}

const statusColors = {
    'novo': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'em contato': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'negociando': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'ganho': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'perdido': 'bg-red-500/10 text-red-400 border-red-500/20',
} as Record<string, string>;

export default function ProspectsList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Formulário do modal
    const [formData, setFormData] = useState<Partial<Prospect>>({
        name: '', phone: '', email: '', city: '', state: '', neighborhood: '', status: 'novo'
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const { data: prospects, isLoading } = useQuery({
        queryKey: ['prospects'],
        queryFn: () => prospectService.getProspects(),
    });

    const createMutation = useMutation({
        mutationFn: (newProspect: any) => prospectService.createProspect(newProspect),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prospects'] });
            setIsModalOpen(false);
            resetForm();
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<Prospect> }) => 
            prospectService.updateProspect(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prospects'] });
            setIsModalOpen(false);
            resetForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => prospectService.deleteProspect(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prospects'] });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateMutation.mutate({ id: editingId, updates: formData });
        } else {
            createMutation.mutate(formData as any);
        }
    };

    const handleEdit = (prospect: Prospect) => {
        setFormData({
            name: prospect.name,
            phone: prospect.phone,
            email: prospect.email || '',
            city: prospect.city || '',
            state: prospect.state || '',
            neighborhood: prospect.neighborhood || '',
            status: prospect.status
        });
        setEditingId(prospect.id);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este prospect?')) {
            deleteMutation.mutate(id);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', phone: '', email: '', city: '', state: '', neighborhood: '', status: 'novo' });
        setEditingId(null);
    };

    // Filtro de Busca
    const filteredProspects = prospects?.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm) ||
        (p.city && p.city.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    // Redireciona para o componente de criar orçamento pré-povoado
    const handleCreateBudget = (prospect: Prospect) => {
        // We will pass the prospect data via URL state
        navigate('/budget/new', { state: { prefillProspect: prospect } });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-white mb-1">
                        Prospects
                    </h1>
                    <p className="text-white/60">
                        Gerencie seus leads e futuros clientes
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="btn btn-primary whitespace-nowrap"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Prospect
                </button>
            </div>

            {/* Barra de Pesquisa */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, telefone ou cidade..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                </div>
            </div>

            {/* Lista de Prospects */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : filteredProspects.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-lg font-display font-semibold text-white/60 mb-2">
                        Nenhum prospect encontrado
                    </h3>
                    <p className="text-sm text-white/30 max-w-md mx-auto">
                        Comece adicionando seu primeiro lead ou crie um orçamento para que ele apareça aqui automaticamente.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredProspects.map(prospect => (
                        <div key={prospect.id} className="glass-card-hover p-5 flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white truncate max-w-[70%]">
                                        {prospect.name}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${statusColors[prospect.status] || statusColors['novo']}`}>
                                        {prospect.status}
                                    </span>
                                </div>
                                
                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-white/60">
                                        <Phone className="w-4 h-4 text-white/40" />
                                        {formatPhone(prospect.phone) || 'Sem telefone'}
                                    </div>
                                    {(prospect.city || prospect.state) && (
                                        <div className="flex items-center gap-2 text-sm text-white/60">
                                            <MapPin className="w-4 h-4 text-white/40" />
                                            {prospect.city}{prospect.state ? ` - ${prospect.state}` : ''}
                                        </div>
                                    )}
                                    {prospect.email && (
                                        <div className="flex items-center gap-2 text-sm text-white/60">
                                            <Mail className="w-4 h-4 text-white/40" />
                                            <span className="truncate">{prospect.email}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                                            <Receipt className="w-4 h-4" />
                                            {prospect.budgets_count || 0} Orçamento(s) gerado(s)
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Ações */}
                            <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(prospect)}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                                        title="Editar Prospect"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(prospect.id)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                                        title="Excluir Prospect"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <button 
                                    onClick={() => handleCreateBudget(prospect)}
                                    className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary-light rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    Gerar Orçamento
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Criação / Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1A1D24] border border-white/10 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingId ? 'Editar Prospect' : 'Novo Prospect'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-white/40 hover:text-white transition-colors text-2xl leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-white/60 font-semibold uppercase tracking-wider">Nome *</label>
                                    <input
                                        type="text" required
                                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-white/60 font-semibold uppercase tracking-wider">WhatsApp / Telefone *</label>
                                    <input
                                        type="text" required
                                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs text-white/60 font-semibold uppercase tracking-wider">E-mail</label>
                                    <input
                                        type="email"
                                        value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-white/60 font-semibold uppercase tracking-wider">Cidade</label>
                                    <input
                                        type="text"
                                        value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-white/60 font-semibold uppercase tracking-wider">Estado (UF)</label>
                                    <input
                                        type="text" maxLength={2}
                                        value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-primary uppercase"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-white/60 font-semibold uppercase tracking-wider">Status</label>
                                    <select
                                        value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}
                                        className="w-full bg-[#1A1D24] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-primary"
                                    >
                                        <option value="novo">Novo</option>
                                        <option value="em contato">Em Contato</option>
                                        <option value="negociando">Negociando</option>
                                        <option value="ganho">Ganho</option>
                                        <option value="perdido">Perdido</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-white/10">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn bg-white/5 text-white hover:bg-white/10">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn btn-primary">
                                    {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar Prospect'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
