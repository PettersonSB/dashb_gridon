import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Search,
    Edit,
    Trash2,
    RefreshCcw,
    PauseCircle,
    PlayCircle,
    FileText,
    Loader2,
    Link2,
    CheckCheck,
    Eye,
    ThumbsUp,
    ThumbsDown
} from "lucide-react";
import { budgetService } from "@/services/budgetService";
import { SolarBudget } from "@/lib/types";

const BUDGET_BASE_URL = 'http://gridon.com.br/orcamento';

export default function BudgetList() {
    const navigate = useNavigate();
    const [budgets, setBudgets] = useState<SolarBudget[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Calcula o status dinâmico (se está vencido baseado na data e validade)
    const getCalculatedStatus = (budget: SolarBudget): SolarBudget['status'] => {
        // Se já foi finalizado ou suspenso, não muda de status
        if (budget.status === 'aprovado' || budget.status === 'recusado' || budget.status === 'suspenso') {
            return budget.status;
        }

        const createdDate = new Date(budget.created_at);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > budget.proposal_validity_days) {
            return 'vencido';
        }
        return budget.status;
    };

    const loadBudgets = async () => {
        try {
            setIsLoading(true);
            const data = await budgetService.getBudgets();
            setBudgets(data);
        } catch (err) {
            console.error("Erro ao carregar orçamentos:", err);
            setError("Não foi possível carregar a lista de orçamentos.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBudgets();
    }, []);

    const handleStatusToggle = async (id: string, currentStatus: SolarBudget['status']) => {
        const newStatus = currentStatus === 'suspenso' ? 'novo' : 'suspenso';
        try {
            await budgetService.updateBudgetStatus(id, newStatus);
            loadBudgets();
        } catch (error) {
            alert("Erro ao alterar o status do orçamento.");
        }
    };

    const handleRenew = async (id: string) => {
        if (!confirm("Isso irá renovar a contagem de validade a partir de hoje. Confirmar?")) return;
        try {
            await budgetService.renewBudget(id);
            loadBudgets();
        } catch (error) {
            alert("Erro ao renovar o orçamento.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esse orçamento permanentemente?")) return;
        try {
            await budgetService.deleteBudget(id);
            loadBudgets();
        } catch (error) {
            alert("Erro ao excluir o orçamento.");
        }
    };

    const filteredBudgets = budgets.filter(b =>
        b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCopyLink = async (budget: SolarBudget) => {
        const url = `${BUDGET_BASE_URL}/${budget.id}`;
        navigator.clipboard.writeText(url).then(async () => {
            setCopiedId(budget.id);
            setTimeout(() => setCopiedId(null), 2000);

            // Muda para em análise somente se for novo
            if (budget.status === 'novo' || !budget.status) {
                try {
                    await budgetService.updateBudgetStatus(budget.id, 'em analise');
                    loadBudgets();
                } catch (e) {
                    console.error("Erro ao mudar status para em análise", e);
                }
            }
        });
    };

    const formatCurrency = (value: number | undefined) => {
        if (value === undefined) return "R$ 0,00";
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    };

    const StatusBadge = ({ status }: { status: SolarBudget['status'] }) => {
        const styles = {
            'novo': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'em analise': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            'visualizado': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            'aprovado': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'recusado': 'bg-red-500/10 text-red-500 border-red-500/20',
            'suspenso': 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
            'vencido': 'bg-red-500/10 text-red-400 border-red-500/20',
        };

        const labels = {
            'novo': 'Novo',
            'em analise': 'Em Análise',
            'visualizado': 'Visualizado',
            'aprovado': 'Aprovado',
            'recusado': 'Recusado',
            'suspenso': 'Suspenso',
            'vencido': 'Vencido',
        };

        const fallbackStyle = 'bg-white/10 text-white/60 border-white/20';

        return (
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${styles[status] || fallbackStyle}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="section-title !mb-0">Todos os Orçamentos</h2>
                        <p className="section-subtitle">Gerencie suas propostas e acompanhe as validades.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 w-full md:w-64 transition-colors"
                        />
                    </div>
                    <Link
                        to="/budget/new"
                        className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                    >
                        Criar Novo
                    </Link>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            {/* List Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-white/40 uppercase bg-white/[0.02] border-b border-white/[0.04]">
                            <tr>
                                <th className="px-6 py-4 font-medium">Cliente</th>
                                <th className="px-6 py-4 font-medium">Data de Criação</th>
                                <th className="px-6 py-4 font-medium">Potência / Valor Est.</th>
                                <th className="px-6 py-4 font-medium text-center">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBudgets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-white/40">
                                        Nenhum orçamento encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredBudgets.map((budget) => {
                                    const calculatedStatus = getCalculatedStatus(budget);

                                    return (
                                        <tr key={budget.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-white">{budget.customer_name}</div>
                                                <div className="text-xs text-white/40 mt-0.5">
                                                    {budget.customer_neighborhood ? `${budget.customer_neighborhood}, ` : ''}{budget.customer_city} - {budget.customer_state}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white/80">{new Date(budget.created_at).toLocaleDateString('pt-BR')}</div>
                                                <div className="text-[11px] text-white/40 mt-1">Validade: {budget.proposal_validity_days} dias</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white font-medium">{budget.kit?.system_power} kWp</div>
                                                <div className="text-primary text-xs mt-0.5">{formatCurrency(budget.kit?.kit_price)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge status={calculatedStatus} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2 text-white/40">

                                                    {/* Copiar Link do Orçamento */}
                                                    <button
                                                        onClick={() => handleCopyLink(budget)}
                                                        className={`p-2 rounded-lg transition-colors ${copiedId === budget.id
                                                            ? 'bg-emerald-500/10 text-emerald-400'
                                                            : 'hover:bg-white/10 hover:text-primary'
                                                            }`}
                                                        title={copiedId === budget.id ? 'Link copiado!' : 'Copiar link do orçamento'}
                                                    >
                                                        {copiedId === budget.id
                                                            ? <CheckCheck className="w-4 h-4" />
                                                            : <Link2 className="w-4 h-4" />
                                                        }
                                                    </button>

                                                    {/* Prévia do Orçamento */}
                                                    <button
                                                        onClick={() => navigate(`/budget/preview/${budget.id}`)}
                                                        className="p-2 hover:bg-white/10 hover:text-blue-400 rounded-lg transition-colors"
                                                        title="Ver Prévia"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {/* Aprovar Orçamento */}
                                                    {calculatedStatus !== 'aprovado' && calculatedStatus !== 'recusado' && calculatedStatus !== 'vencido' && (
                                                        <button
                                                            onClick={() => handleStatusToggle(budget.id, 'aprovado' as any)}
                                                            className="p-2 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg transition-colors"
                                                            title="Aprovar Orçamento"
                                                        >
                                                            <ThumbsUp className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Recusar Orçamento */}
                                                    {calculatedStatus !== 'aprovado' && calculatedStatus !== 'recusado' && calculatedStatus !== 'vencido' && (
                                                        <button
                                                            onClick={() => handleStatusToggle(budget.id, 'recusado' as any)}
                                                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                                                            title="Recusar Orçamento"
                                                        >
                                                            <ThumbsDown className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Renovar - Apenas visível se estiver vencido */}
                                                    {calculatedStatus === 'vencido' && (
                                                        <button
                                                            onClick={() => handleRenew(budget.id)}
                                                            className="p-2 hover:bg-white/10 hover:text-emerald-400 rounded-lg transition-colors"
                                                            title="Renovar Validade"
                                                        >
                                                            <RefreshCcw className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Suspender/Reativar */}
                                                    {calculatedStatus !== 'vencido' && calculatedStatus !== 'aprovado' && calculatedStatus !== 'recusado' && (
                                                        <button
                                                            onClick={() => handleStatusToggle(budget.id, budget.status === 'suspenso' ? 'novo' : 'suspenso' as any)}
                                                            className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${budget.status === 'suspenso' ? 'hover:text-amber-400' : 'hover:text-orange-400'}`}
                                                            title={budget.status === 'suspenso' ? "Reativar" : "Suspender"}
                                                        >
                                                            {budget.status === 'suspenso' ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                                                        </button>
                                                    )}

                                                    {/* Editar */}
                                                    <button
                                                        onClick={() => navigate(`/budget/edit/${budget.id}`)}
                                                        className="p-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>

                                                    {/* Excluir */}
                                                    <button
                                                        onClick={() => handleDelete(budget.id)}
                                                        className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                                        title="Excluir Permanentemente"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
