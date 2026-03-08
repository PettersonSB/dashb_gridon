import { Calculator, CheckCircle2, Clock, XCircle, FilePlus, Download, TrendingUp } from "lucide-react";

// Mock data for the budget overview
const budgetStats = [
    { label: "Total Recebidos", value: "142", icon: Calculator, color: "text-blue-400" },
    { label: "Em Análise", value: "12", icon: Clock, color: "text-amber-400" },
    { label: "Aprovados (Mês)", value: "24", icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Taxa de Conversão", value: "68%", icon: TrendingUp, color: "text-violet-400" },
];

const recentBudgets = [
    { id: "ORC-001", client: "João Silva", service: "Residencial (8 Módulos)", status: "Novo", date: "Hoje, 10:45", amount: "R$ 15.400" },
    { id: "ORC-002", client: "Empresa XPTO Ltda", service: "Comercial (32 Módulos)", status: "Em Análise", date: "Ontem, 16:30", amount: "R$ 48.200" },
    { id: "ORC-003", client: "Maria Oliveira", service: "Residencial (12 Módulos)", status: "Aprovado", date: "04 Mar, 09:15", amount: "R$ 21.000" },
    { id: "ORC-004", client: "Fazenda Boa Vista", service: "Rural (Agro)", status: "Aprovado", date: "02 Mar, 14:20", amount: "R$ 115.000" },
    { id: "ORC-005", client: "Carlos Souza", service: "Manutenção Preventiva", status: "Recusado", date: "28 Fev, 11:00", amount: "R$ 850" },
];

const BudgetOverview = () => {
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
                    {[
                        { label: "Adicionar Manual", desc: "Criar novo orçamento interno", icon: FilePlus, color: "text-primary" },
                        { label: "Exportar Relatório", desc: "Baixar PDF do último mês", icon: Download, color: "text-emerald-400" },
                        { label: "Configurar Preços", desc: "Alterar tabela base de cálculo", icon: Calculator, color: "text-amber-400" },
                    ].map((action, idx) => (
                        <button
                            key={idx}
                            className="glass-card-hover p-5 flex items-start gap-4 group text-left w-full"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.1] transition-colors">
                                <action.icon className={`w-5 h-5 ${action.color}`} />
                            </div>
                            <div>
                                <h4 className="font-medium text-white text-sm group-hover:text-primary transition-colors">{action.label}</h4>
                                <p className="text-xs text-white/30 mt-0.5">{action.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent Budgets Table */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-display font-semibold text-white">Solicitações Recentes</h3>
                    <button className="text-sm text-primary hover:text-white transition-colors">Ver todas</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-white/40 uppercase bg-white/[0.02]">
                            <tr>
                                <th className="px-4 py-3 font-medium rounded-l-xl">ID</th>
                                <th className="px-4 py-3 font-medium">Cliente</th>
                                <th className="px-4 py-3 font-medium">Serviço/Tamanho</th>
                                <th className="px-4 py-3 font-medium">Data</th>
                                <th className="px-4 py-3 font-medium">Valor Est.</th>
                                <th className="px-4 py-3 font-medium rounded-r-xl">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentBudgets.map((budget, i) => (
                                <tr key={budget.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-4 font-medium text-white/70">{budget.id}</td>
                                    <td className="px-4 py-4 text-white">{budget.client}</td>
                                    <td className="px-4 py-4 text-white/60">{budget.service}</td>
                                    <td className="px-4 py-4 text-white/40">{budget.date}</td>
                                    <td className="px-4 py-4 text-white/80">{budget.amount}</td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${budget.status === 'Novo' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                budget.status === 'Em Análise' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    budget.status === 'Aprovado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {budget.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BudgetOverview;
