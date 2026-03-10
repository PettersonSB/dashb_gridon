import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calculator, CheckCircle2, Clock, FilePlus, Download, TrendingUp, Loader2 } from "lucide-react";
import { budgetService } from "@/services/budgetService";
import { SolarBudget } from "@/lib/types";

export default function BudgetOverview() {
    const [budgets, setBudgets] = useState<SolarBudget[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
    const totalRecebidos = budgets.length;
    const emAnalise = budgets.filter(b => b.status === "em analise" || b.status === "visualizado").length;

    // Calcula aprovados no mês atual
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const aprovadosThisMonth = budgets.filter(b => {
        const date = new Date(b.created_at);
        return b.status === "aprovado" && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const totalResolvidos = budgets.filter(b => b.status === "aprovado" || b.status === "recusado").length;
    const taxaConversao = totalResolvidos > 0
        ? Math.round((budgets.filter(b => b.status === "aprovado").length / totalResolvidos) * 100)
        : 0;

    const budgetStats = [
        { label: "Total Recebidos", value: totalRecebidos.toString(), icon: Calculator, color: "text-blue-400" },
        { label: "Em Negociação", value: emAnalise.toString(), icon: Clock, color: "text-amber-400" },
        { label: "Aprovados (Mês)", value: aprovadosThisMonth.toString(), icon: CheckCircle2, color: "text-emerald-400" },
        { label: "Taxa de Conversão", value: `${taxaConversao}%`, icon: TrendingUp, color: "text-violet-400" },
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {budgetStats.map((stat) => (
                    <div key={stat.label} className="card-stat">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-white/40">{stat.label}</span>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <span className="font-display text-3xl font-bold text-white mt-3 block">{stat.value}</span>
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
                    <Link to="/budget" className="text-sm text-primary hover:text-white transition-colors">Ver todas</Link>
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
                                        {budget.kit ? `${budget.kit.system_power} kWp (${budget.kit.panels_count} Módulos)` : 'Personalizado'}
                                    </td>
                                    <td className="px-4 py-4 text-white/40">
                                        {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-4 text-white/80">
                                        {formatCurrency(budget.kit?.kit_price)}
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
        </div>
    );
}
