import { FileText, MessageSquareQuote, BarChart3, Sparkles, Wrench, Eye } from "lucide-react";

const stats = [
    { label: "Blog Posts", value: "6", icon: FileText, color: "text-primary" },
    { label: "Depoimentos", value: "4", icon: MessageSquareQuote, color: "text-emerald-400" },
    { label: "Serviços", value: "6", icon: Wrench, color: "text-amber-400" },
    { label: "Visualizações", value: "—", icon: Eye, color: "text-violet-400" },
];

const Dashboard = () => {
    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h2 className="section-title">Visão Geral</h2>
                <p className="section-subtitle">Resumo do conteúdo do site Gridon Solar</p>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="card-stat">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-white/40">{stat.label}</span>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <span className="font-display text-3xl font-bold text-white">{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-display font-semibold text-white mb-4">Ações Rápidas</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { label: "Novo Post", desc: "Criar um artigo para o blog", href: "/blog", icon: FileText },
                        { label: "Editar Hero", desc: "Alterar headline e CTA", href: "/hero", icon: Sparkles },
                        { label: "Métricas", desc: "Atualizar números em destaque", href: "/stats", icon: BarChart3 },
                    ].map((action) => (
                        <a
                            key={action.href}
                            href={action.href}
                            className="glass-card-hover p-5 flex items-start gap-4 group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                <action.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-medium text-white text-sm group-hover:text-primary transition-colors">{action.label}</h4>
                                <p className="text-xs text-white/30 mt-0.5">{action.desc}</p>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-display font-semibold text-white mb-4">Atividade Recente</h3>
                <div className="space-y-3">
                    {[
                        { action: "Post publicado", detail: "Como Funciona a Energia Solar Fotovoltaica?", time: "2h atrás" },
                        { action: "Hero atualizado", detail: "Headline e CTA modificados", time: "5h atrás" },
                        { action: "Depoimento adicionado", detail: "Juliana F. — Residencial", time: "1d atrás" },
                    ].map((activity, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                            <div>
                                <p className="text-sm text-white/70">{activity.action}</p>
                                <p className="text-xs text-white/30">{activity.detail}</p>
                            </div>
                            <span className="text-xs text-white/20">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
