import { useState, useEffect } from "react";
import { emitToast } from "@/components/ui/Toaster";
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
    ThumbsDown,
    Clock,
    BarChart2
} from "lucide-react";
import { budgetService } from "@/services/budgetService";
import { SolarBudget } from "@/lib/types";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import AnalyticsModal from "@/components/AnalyticsModal";

const BUDGET_BASE_URL = 'http://gridon.com.br/orcamento';

/* ─── Countdown helper for budget list ─── */
const BudgetCountdown = ({ budget, calculatedStatus }: { budget: SolarBudget; calculatedStatus: SolarBudget['status'] }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (calculatedStatus === 'aprovado' || calculatedStatus === 'recusado') return;

        const targetDate = new Date(new Date(budget.created_at).getTime() + budget.proposal_validity_days * 24 * 60 * 60 * 1000);

        const update = () => {
            const now = new Date().getTime();
            const diff = targetDate.getTime() - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft('');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((diff / (1000 * 60)) % 60);
            const secs = Math.floor((diff / 1000) % 60);

            const pad = (n: number) => n.toString().padStart(2, '0');

            if (days > 0) {
                setTimeLeft(`${days}d ${pad(hours)}h ${pad(mins)}m`);
            } else {
                setTimeLeft(`${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`);
            }
        };

        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [budget.created_at, budget.proposal_validity_days, calculatedStatus]);

    if (calculatedStatus === 'aprovado') {
        return (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <CheckCheck className="w-3.5 h-3.5" /> Aprovado
            </span>
        );
    }

    if (calculatedStatus === 'recusado') {
        return (
            <span className="inline-flex items-center gap-1.5 text-red-400 text-xs font-semibold">
                <ThumbsDown className="w-3.5 h-3.5" /> Recusado
            </span>
        );
    }

    if (isExpired || calculatedStatus === 'vencido') {
        return (
            <span className="inline-flex items-center gap-1.5 text-red-400/80 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" /> Expirado
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-mono font-medium tabular-nums">
            <Clock className="w-3.5 h-3.5 animate-pulse" /> {timeLeft}
        </span>
    );
};

export default function BudgetList() {
    const navigate = useNavigate();
    const [budgets, setBudgets] = useState<SolarBudget[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [analyticsTarget, setAnalyticsTarget] = useState<SolarBudget | null>(null);

    // Calcula o status dinâmico (se está vencido baseado na data e validade)
    const getCalculatedStatus = (budget: SolarBudget): SolarBudget['status'] => {
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

    const handleUpdateStatus = async (id: string, newStatus: SolarBudget['status']) => {
        try {
            await budgetService.updateBudgetStatus(id, newStatus);
            loadBudgets();
        } catch (error) {
            emitToast({ title: "Erro", description: "Erro ao alterar o status do orçamento.", variant: "destructive" });
        }
    };

    const handleRenew = async (id: string) => {
        if (!await confirmAction({ title: "Renovar Validade", message: "Isso irá renovar a contagem de validade a partir de hoje. Confirmar?", variant: "info" })) return;
        try {
            await budgetService.renewBudget(id);
            loadBudgets();
        } catch (error) {
            emitToast({ title: "Erro", description: "Erro ao renovar o orçamento.", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirmAction({ title: "Excluir Orçamento", message: "Tem certeza que deseja excluir esse orçamento permanentemente?", variant: "danger" })) return;
        try {
            await budgetService.deleteBudget(id);
            loadBudgets();
        } catch (error) {
            emitToast({ title: "Erro", description: "Erro ao excluir o orçamento.", variant: "destructive" });
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
                                <th className="px-6 py-4 font-medium text-center">Expira em</th>
                                <th className="px-6 py-4 font-medium text-center">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBudgets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-white/40">
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
                                                <div className="text-[10px] font-mono text-white/20 mt-1 uppercase tracking-tighter">
                                                    ID: {budget.id}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white/80">{new Date(budget.created_at).toLocaleDateString('pt-BR')}</div>
                                                <div className="text-[11px] text-white/40 mt-1 mb-1">Validade: {budget.proposal_validity_days} dias</div>
                                                <div className="text-[11px] text-primary/80 mt-1 font-medium bg-primary/10 inline-block px-1.5 py-0.5 rounded border border-primary/20">
                                                    Por: {budget.created_by_name || 'Sistema'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white font-medium">{budget.kit?.system_power} kWp</div>
                                                <div className="text-primary text-xs mt-0.5">{formatCurrency(budget.kit?.kit_price)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <BudgetCountdown budget={budget} calculatedStatus={calculatedStatus} />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge status={calculatedStatus} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2 text-white/40">

                                                    {/* Analytics da Proposta */}
                                                    <button
                                                        onClick={() => setAnalyticsTarget(budget)}
                                                        className="p-2 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                                                        title="Analytics da Proposta"
                                                    >
                                                        <BarChart2 className="w-4 h-4" />
                                                    </button>

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
                                                            onClick={() => handleUpdateStatus(budget.id, 'aprovado')}
                                                            className="p-2 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg transition-colors"
                                                            title="Aprovar Orçamento"
                                                        >
                                                            <ThumbsUp className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Recusar Orçamento */}
                                                    {calculatedStatus !== 'aprovado' && calculatedStatus !== 'recusado' && calculatedStatus !== 'vencido' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(budget.id, 'recusado')}
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
                                                    {calculatedStatus !== 'vencido' && calculatedStatus !== 'recusado' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(budget.id, budget.status === 'suspenso' ? 'novo' : 'suspenso')}
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

            {/* Analytics Modal */}
            {analyticsTarget && (
                <AnalyticsModal
                    budgetId={analyticsTarget.id}
                    customerName={analyticsTarget.customer_name}
                    onClose={() => setAnalyticsTarget(null)}
                />
            )}
        </div>
    );
}
