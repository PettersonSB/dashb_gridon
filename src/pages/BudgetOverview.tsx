import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calculator, CheckCircle2, Clock, FilePlus, Download, TrendingUp, Loader2 } from "lucide-react";
import { budgetService } from "@/services/budgetService";
import { SolarBudget } from "@/lib/types";
import ConversionChartModal from "@/components/ConversionChartModal";

export default function BudgetOverview() {
    const navigate = useNavigate();
    const [budgets, setBudgets] = useState<SolarBudget[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showChart, setShowChart] = useState(false);
    const [selectedMonthStr, setSelectedMonthStr] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    useEffect(() => {
        const loadBudgets = async () => {
            try {
                const data = await budgetService.getBudgets();
                setBudgets(data);
            } catch (err) {
                console.error("Erro ao carregar orçamentos:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadBudgets();
    }, []);

    // Calcula os stats
    const orcamentosTotais = budgets.filter(b => b.status && b.status !== 'excluido' as any).length;
    const emNegociacao = budgets.filter(b => ['novo', 'em analise', 'visualizado'].includes(b.status)).length;

    // Calcula aprovados no mês selecionado
    const [selYear, selMonth] = selectedMonthStr.split('-');
    const aprovadosThisMonth = budgets.filter(b => {
        const date = new Date(b.created_at);
        return b.status === "aprovado" && 
               date.getMonth() === (parseInt(selMonth) - 1) && 
               date.getFullYear() === parseInt(selYear);
    }).length;

    const totalResolvidos = budgets.filter(b => b.status === "aprovado" || b.status === "recusado").length;
    const taxaConversao = totalResolvidos > 0
        ? Math.round((budgets.filter(b => b.status === "aprovado").length / totalResolvidos) * 100)
        : 0;

    // Calcula meses disponíveis para o select
    const availableMonths = Array.from({ length: 12 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        return { val, label: label.charAt(0).toUpperCase() + label.slice(1) };
    });

    const handleCardClick = (type: string) => {
        if (type === 'negociacao') {
            navigate('/budget/list?filter=negociacao');
        } else if (type === 'aprovados') {
            navigate(`/budget/list?filter=aprovado&month=${selectedMonthStr}`);
        } else if (type === 'conversao') {
            setShowChart(true);
        }
    };

    const budgetStats = [
        { id: 'totais', label: "Orçamentos Totais", value: orcamentosTotais.toString(), icon: Calculator, color: "text-amber-500" },
        { id: 'negociacao', label: "Em Negociação", value: emNegociacao.toString(), icon: Clock, color: "text-amber-500", clickable: true },
        { id: 'aprovados', label: "Aprovados", value: aprovadosThisMonth.toString(), icon: CheckCircle2, color: "text-amber-500", clickable: true, hasMonthSelect: true },
        { id: 'conversao', label: "Taxa de Conversão", value: `${taxaConversao}%`, icon: TrendingUp, color: "text-amber-500", clickable: true },
    ];

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

    const calculateFinalCashPrice = (budget: SolarBudget) => {
        const kitPrice = budget.kit?.kit_price || 0;
        const labor = budget.labor_cost || 0;
        const engineering = budget.engineering_cost || 0;
        const profitAmt = budget.profit_type === 'percentage' ? (kitPrice * (budget.profit_value || 0) / 100) : (budget.profit_value || 0);
        const commissionAmt = budget.commission_type === 'percentage' ? (kitPrice * (budget.commission_value || 0) / 100) : (budget.commission_value || 0);
        const taxAmt = budget.tax_type === 'percentage' ? (kitPrice * (budget.tax_value || 0) / 100) : (budget.tax_value || 0);

        const finalSystemPrice = kitPrice + labor + engineering + profitAmt + commissionAmt + taxAmt;

        if (budget.pix_mode === 'manual') {
            return budget.pix_manual_value || 0;
        }
        return finalSystemPrice * (1 - (budget.pix_discount || 5) / 100);
    };

    const getModuleCount = (kit: any) => {
        if (!kit) return 0;
        if (kit.panels_count) return kit.panels_count;
        if (kit.items && Array.isArray(kit.items)) {
            return kit.items.reduce((acc: number, item: any) => {
                const cat = item.product?.category?.toLowerCase() || '';
                if (cat.includes('módulo') || cat.includes('modulo')) {
                    return acc + item.quantity;
                }
                return acc;
            }, 0);
        }
        return 0;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            <div>
                <h2 className="section-title">Orçamentos - Visão Geral</h2>
                <p className="section-subtitle">Painel administrativo de solicitações de orçamento</p>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {budgetStats.map((stat) => (
                    <div 
                        key={stat.id} 
                        className={`bg-[#13161C]/90 border border-amber-500/15 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 shadow-xl shadow-black/40 hover:border-amber-500/40 hover:bg-[#171A21] hover:shadow-amber-500/[0.04] group ${stat.clickable ? 'cursor-pointer hover:-translate-y-1 active:translate-y-0' : ''}`}
                        onClick={() => stat.clickable && handleCardClick(stat.id)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-white/40">{stat.label}</span>
                                <span className="font-display text-3xl font-black mt-2 block tracking-tight bg-gradient-to-br from-amber-400 to-yellow-500 bg-clip-text text-transparent group-hover:from-amber-300 group-hover:to-yellow-400 transition-all duration-300">
                                    {stat.value}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300">
                                <stat.icon className="w-5 h-5 stroke-[2]" />
                            </div>
                        </div>
                        
                        {stat.hasMonthSelect && (
                            <div className="mt-4" onClick={e => e.stopPropagation()}>
                                <select 
                                    value={selectedMonthStr} 
                                    onChange={e => setSelectedMonthStr(e.target.value)}
                                    className="w-full bg-white/[0.02] border border-white/10 text-xs text-white/70 rounded-xl px-3 py-2 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all duration-200 cursor-pointer hover:bg-white/5"
                                >
                                    {availableMonths.map(m => (
                                        <option key={m.val} value={m.val} className="bg-slate-950 text-white">{m.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-display font-semibold text-white mb-4">Ações Rápidas</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link to="/budget/new" className="glass-card-hover p-5 flex items-start gap-4 group text-left w-full">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.1] transition-colors">
                            <FilePlus className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-medium text-white text-sm group-hover:text-primary transition-colors">Adicionar Manual</h4>
                            <p className="text-xs text-white/30 mt-0.5">Criar novo orçamento interno</p>
                        </div>
                    </Link>
                    <button className="glass-card-hover p-5 flex items-start gap-4 group text-left w-full">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.1] transition-colors">
                            <Download className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="font-medium text-white text-sm group-hover:text-primary transition-colors">Exportar Relatório</h4>
                            <p className="text-xs text-white/30 mt-0.5">Baixar PDF do último mês</p>
                        </div>
                    </button>
                    <Link to="/products" className="glass-card-hover p-5 flex items-start gap-4 group text-left w-full">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.1] transition-colors">
                            <Calculator className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h4 className="font-medium text-white text-sm group-hover:text-primary transition-colors">Configurar Kits</h4>
                            <p className="text-xs text-white/30 mt-0.5">Alterar produtos e valores</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent Budgets Table */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-display font-semibold text-white">Solicitações Recentes</h3>
                    <Link to="/budget/list" className="text-sm text-primary hover:text-white transition-colors">Ver todas</Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-white/40 uppercase bg-white/[0.02]">
                            <tr>
                                <th className="px-4 py-3 font-medium rounded-l-xl">Cliente</th>
                                <th className="px-4 py-3 font-medium">Serviço/Tamanho</th>
                                <th className="px-4 py-3 font-medium">Data</th>
                                <th className="px-4 py-3 font-medium">Valor Est.</th>
                                <th className="px-4 py-3 font-medium rounded-r-xl">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {budgets.slice(0, 5).map((budget) => (
                                <tr key={budget.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-4 text-white">
                                        <div className="font-medium">{budget.customer_name}</div>
                                        <div className="text-xs text-white/40 mt-0.5">{budget.customer_city} - {budget.customer_state}</div>
                                    </td>
                                    <td className="px-4 py-4 text-white/60">
                                        {budget.kit ? `${budget.kit.system_power} kWp (${getModuleCount(budget.kit)} Módulos)` : 'Personalizado'}
                                    </td>
                                    <td className="px-4 py-4 text-white/40">
                                        {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-4 text-white/80">
                                        {formatCurrency(calculateFinalCashPrice(budget))}
                                    </td>
                                    <td className="px-4 py-4">
                                        <StatusBadge status={budget.status} />
                                    </td>
                                </tr>
                            ))}
                            {budgets.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-white/40">
                                        Nenhum orçamento encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modal de Gráfico */}
            {showChart && <ConversionChartModal budgets={budgets} onClose={() => setShowChart(false)} />}
        </div>
    );
}
