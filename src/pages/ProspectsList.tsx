import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Users, Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, 
    Calendar, DollarSign, Loader2, ArrowRight, Receipt, X, UserPlus, Zap
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
    
    // Estados para o fluxo de conversão
    const [showBudgetSelectModal, setShowBudgetSelectModal] = useState(false);
    const [prospectToConvert, setProspectToConvert] = useState<Prospect | null>(null);
    const [prospectBudgets, setProspectBudgets] = useState<any[]>([]);
    const [loadingBudgets, setLoadingBudgets] = useState(false);

    const handleConvertToClient = async (prospect: Prospect) => {
        setProspectToConvert(prospect);
        setLoadingBudgets(true);
        try {
            const budgets = await prospectService.getProspectBudgets(prospect.id);
            setProspectBudgets(budgets);
            if (budgets.length > 0) {
                setShowBudgetSelectModal(true);
            } else {
                // Sem orçamentos - navega direto com os dados do prospect
                navigate('/devices/clients', {
                    state: {
                        convertProspect: { prospect, selectedBudget: null }
                    }
                });
            }
        } catch (err) {
            console.error('Erro ao buscar orçamentos do prospect:', err);
            alert('Erro ao buscar orçamentos do prospect.');
        } finally {
            setLoadingBudgets(false);
        }
    };

    const handleSelectBudget = (budget: any) => {
        setShowBudgetSelectModal(false);
        navigate('/devices/clients', {
            state: {
                convertProspect: {
                    prospect: prospectToConvert,
                    selectedBudget: budget
                }
            }
        });
    };
    
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
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 whitespace-nowrap"
                >
                    <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
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
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/[0.01]">
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">Nome / Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">WhatsApp / Telefone</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">Localização</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">E-mail</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">Orçamentos</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredProspects.map(prospect => (
                                    <tr key={prospect.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="font-semibold text-white">{prospect.name}</div>
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border ${statusColors[prospect.status] || statusColors['novo']}`}>
                                                    {prospect.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-white/30" />
                                                {formatPhone(prospect.phone) || 'Sem telefone'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                                            {prospect.city || prospect.state ? (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-white/30" />
                                                    {prospect.city}{prospect.state ? ` - ${prospect.state}` : ''}
                                                </div>
                                            ) : (
                                                <span className="text-white/30">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                                            {prospect.email ? (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-white/30" />
                                                    {prospect.email}
                                                </div>
                                            ) : (
                                                <span className="text-white/30">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                                                <Receipt className="w-3.5 h-3.5" />
                                                {prospect.budgets_count || 0} Orçamento(s)
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {prospect.converted_to_client_id ? (
                                                    <button
                                                        onClick={() => navigate(`/devices/clients/${prospect.converted_to_client_id}`)}
                                                        className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                                                        title="Ver ficha do cliente convertido"
                                                    >
                                                        ✅ Convertido
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => handleCreateBudget(prospect)}
                                                            className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary-light rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
                                                            title="Gerar Novo Orçamento"
                                                        >
                                                            Gerar
                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                        </button>
                                                        
                                                        <button 
                                                            onClick={() => handleConvertToClient(prospect)}
                                                            className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                                                            disabled={loadingBudgets && prospectToConvert?.id === prospect.id}
                                                            title="Converter Prospect para Cliente"
                                                        >
                                                            {loadingBudgets && prospectToConvert?.id === prospect.id ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <UserPlus className="w-3.5 h-3.5" />
                                                            )}
                                                            Virar Cliente
                                                        </button>
                                                    </>
                                                )}
                                                
                                                <button
                                                    onClick={() => handleEdit(prospect)}
                                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                                                    title="Editar Prospect"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(prospect.id)}
                                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                                                    title="Excluir Prospect"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Criação / Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#13161C] border border-white/10 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/80 animate-in slide-in-from-bottom-4 duration-300">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <Users className="w-4.5 h-4.5 text-amber-500" />
                                </div>
                                <h2 className="text-xl font-bold text-white tracking-wide">
                                    {editingId ? 'Editar Prospect' : 'Novo Prospect'}
                                </h2>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-white/50 font-bold uppercase tracking-wider">Nome *</label>
                                    <input
                                        type="text" required
                                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all duration-200"
                                        placeholder="Ex: João da Silva"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-white/50 font-bold uppercase tracking-wider">WhatsApp / Telefone *</label>
                                    <input
                                        type="text" required
                                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all duration-200"
                                        placeholder="Ex: (61) 99999-9999"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs text-white/50 font-bold uppercase tracking-wider">E-mail</label>
                                    <input
                                        type="email"
                                        value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})}
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all duration-200"
                                        placeholder="Ex: contato@email.com"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-white/50 font-bold uppercase tracking-wider">Cidade</label>
                                    <input
                                        type="text"
                                        value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})}
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all duration-200"
                                        placeholder="Ex: Brasília"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-white/50 font-bold uppercase tracking-wider">Estado (UF)</label>
                                    <input
                                        type="text" maxLength={2}
                                        value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})}
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all duration-200 uppercase"
                                        placeholder="Ex: DF"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-white/50 font-bold uppercase tracking-wider">Status</label>
                                    <select
                                        value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}
                                        className="w-full bg-[#1A1D24] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all duration-200"
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
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all duration-200 text-sm"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={createMutation.isPending || updateMutation.isPending} 
                                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/10 text-sm"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar Prospect'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Seleção de Orçamento para Conversão */}
            {showBudgetSelectModal && prospectToConvert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#13161C] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/80 animate-in slide-in-from-bottom-4 duration-300">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <Receipt className="w-4.5 h-4.5 text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-wide">
                                        Selecionar Orçamento Aprovado
                                    </h2>
                                    <p className="text-xs text-white/50 mt-0.5">
                                        Selecione qual proposta fechada servirá de base para o cadastro do cliente {prospectToConvert.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowBudgetSelectModal(false)}
                                className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* List of budgets */}
                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            {prospectBudgets.map((budget) => {
                                const systemPower = budget.kit?.system_power || 0;
                                const systemType = budget.kit?.system_type || 'Solar';
                                const kitPrice = budget.kit?.kit_price || 0;
                                return (
                                    <div
                                        key={budget.id}
                                        onClick={() => handleSelectBudget(budget)}
                                        className="group p-5 bg-white/[0.02] hover:bg-amber-500/[0.03] border border-white/5 hover:border-amber-500/30 rounded-xl cursor-pointer transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                                                    {budget.kit?.name || 'Sistema Solar'}
                                                </span>
                                                <span className="text-[10px] text-white/40">
                                                    ({new Date(budget.created_at).toLocaleDateString('pt-BR')})
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
                                                <span className="flex items-center gap-1">
                                                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                                                    {systemPower} kWp
                                                </span>
                                                <span>• {systemType}</span>
                                                <span>• {budget.supply_type}</span>
                                                {budget.energy_tariff && (
                                                    <span>• Tarifa: R$ {budget.energy_tariff.toFixed(2)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center md:flex-col md:items-end justify-between gap-2 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                                            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                                                R$ {kitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border ${
                                                budget.status === 'aprovado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                budget.status === 'visualizado' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                'bg-white/5 text-white/60 border-white/10'
                                            }`}>
                                                {budget.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Direct conversion button */}
                        <div className="pt-6 flex justify-between items-center mt-6 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowBudgetSelectModal(false);
                                    navigate('/devices/clients', {
                                        state: {
                                            convertProspect: { prospect: prospectToConvert, selectedBudget: null }
                                        }
                                    });
                                }}
                                className="text-xs text-white/50 hover:text-white underline transition-colors"
                            >
                                Continuar sem vincular orçamento
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setShowBudgetSelectModal(false)} 
                                className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all duration-200 text-sm"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
