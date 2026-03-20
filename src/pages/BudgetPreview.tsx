import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, User, MapPin, Zap, Sun, Battery, Shield, Calendar, Clock, Loader2, AlertCircle, Copy, CheckCheck } from "lucide-react";
import { budgetService } from "@/services/budgetService";
import { SolarBudget } from "@/lib/types";

const BUDGET_BASE_URL = "http://gridon.com.br/orcamento";

function formatCurrency(v?: number | null) {
    if (v === undefined || v === null) return "—";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function BudgetPreview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [budget, setBudget] = useState<SolarBudget | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const publicUrl = `${BUDGET_BASE_URL}/${id}`;

    useEffect(() => {
        if (!id) return;
        budgetService.getBudgetById(id)
            .then(setBudget)
            .catch(() => setError("Não foi possível carregar o orçamento."))
            .finally(() => setIsLoading(false));
    }, [id]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (error || !budget) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-white/60">{error || "Orçamento não encontrado."}</p>
                <button onClick={() => navigate("/budget/list")} className="btn-ghost text-sm">
                    Voltar para Lista
                </button>
            </div>
        );
    }

    // Reconstrução do valor total (Sistema + Mão de Obra + Margens)
    const kit = budget.kit;
    const kitPrice = kit?.kit_price || 0;
    const labor = budget.labor_cost || 0;
    const engineering = budget.engineering_cost || 0;
    
    const profitAmt = budget.profit_type === 'percentage' 
        ? (kitPrice * (budget.profit_value || 0) / 100) 
        : (budget.profit_value || 0);
        
    const commissionAmt = budget.commission_type === 'percentage' 
        ? (kitPrice * (budget.commission_value || 0) / 100) 
        : (budget.commission_value || 0);
        
    const taxAmt = budget.tax_type === 'percentage' 
        ? (kitPrice * (budget.tax_value || 0) / 100) 
        : (budget.tax_value || 0);

    const finalSystemPrice = kitPrice + labor + engineering + profitAmt + commissionAmt + taxAmt;

    const consumption = budget.average_monthly_consumption ?? 200;
    const monthlySavings = consumption * (budget.energy_tariff || 0.85) * 0.95; // Simplified but consistent with new logic
    const roi = finalSystemPrice > 0
        ? Math.round((finalSystemPrice / (monthlySavings * 12)) * 10) / 10
        : null;
    const savings25 = Math.round(monthlySavings * 12 * 25);

    return (
        <div className="animate-fade-in space-y-6 pb-10">
            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/budget/list")}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/70 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-display font-bold text-white">Prévia do Orçamento</h2>
                        <p className="text-xs text-white/30 font-mono mt-0.5">ID: {id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCopyLink}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                            copied
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white hover:border-white/20"
                        }`}
                    >
                        {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Link copiado!" : "Copiar link"}
                    </button>
                    <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glow-btn flex items-center gap-2 text-sm px-4 py-2"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Ver Proposta
                    </a>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left Column — Customer & Dates ── */}
                <div className="space-y-4">
                    {/* Customer */}
                    <div className="glass-card p-5 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white/30 uppercase tracking-widest">
                            <User className="w-3.5 h-3.5" /> Cliente
                        </div>
                        <div>
                            <p className="text-lg font-bold text-white font-display">{budget.customer_name}</p>
                            {budget.customer_email && (
                                <p className="text-sm text-white/40 mt-0.5">{budget.customer_email}</p>
                            )}
                            {budget.customer_phone && (
                                <p className="text-sm text-white/40">{budget.customer_phone}</p>
                            )}
                        </div>
                        <div className="flex items-start gap-2 text-sm text-white/40">
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary/60" />
                            <span>
                                {[budget.customer_neighborhood, budget.customer_city, budget.customer_state]
                                    .filter(Boolean).join(", ")}
                            </span>
                        </div>
                    </div>

                    {/* Dates & Consumption */}
                    <div className="glass-card p-5 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white/30 uppercase tracking-widest">
                            <Calendar className="w-3.5 h-3.5" /> Dados da Proposta
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40">Criado em</span>
                                <span className="text-white font-medium">
                                    {new Date(budget.created_at).toLocaleDateString("pt-BR")}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40">Válido por</span>
                                <span className="text-white font-medium">{budget.proposal_validity_days} dias</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40">Consumo Médio</span>
                                <span className="text-white font-medium">{budget.average_monthly_consumption ?? "—"} kWh/mês</span>
                            </div>
                            {budget.energy_tariff && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/40">Tarifa de Energia</span>
                                    <span className="text-white font-medium">R$ {budget.energy_tariff.toFixed(2)}/kWh</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Technical info */}
                    <div className="glass-card p-5 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white/30 uppercase tracking-widest">
                            <Zap className="w-3.5 h-3.5" /> Instalação
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/40">Tipo de Fornecimento</span>
                                <span className="text-white font-medium capitalize">{budget.supply_type ?? "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Local</span>
                                <span className="text-white font-medium capitalize">{budget.installation_location ?? "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Tipo de Imóvel</span>
                                <span className="text-white font-medium capitalize">{budget.construction_type ?? "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Garantia Instalação</span>
                                <span className="text-white font-medium">
                                    {budget.installation_warranty ? `${budget.installation_warranty} anos` : "—"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Center Column — Kit Details ── */}
                <div className="space-y-4">
                    {kit ? (
                        <>
                            <div className="glass-card p-5 space-y-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-white/30 uppercase tracking-widest">
                                    <Sun className="w-3.5 h-3.5" /> Kit Solar
                                </div>
                                <p className="text-base font-bold text-white">{kit.name ?? "—"}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
                                        <p className="text-[10px] text-white/30 uppercase tracking-widest">Potência</p>
                                        <p className="text-lg font-bold text-primary font-mono mt-1">{kit.system_power} kWp</p>
                                    </div>
                                    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
                                        <p className="text-[10px] text-white/30 uppercase tracking-widest">Preço</p>
                                        <p className="text-lg font-bold text-emerald-400 font-mono mt-1">{formatCurrency(kit.kit_price)}</p>
                                    </div>
                                    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
                                        <p className="text-[10px] text-white/30 uppercase tracking-widest">Geração Estimada</p>
                                        <p className="text-base font-bold text-white font-mono mt-1">
                                            {kit.estimated_generation ? `${kit.estimated_generation} kWh` : "—"}
                                        </p>
                                    </div>
                                    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
                                        <p className="text-[10px] text-white/30 uppercase tracking-widest">Painéis</p>
                                        <p className="text-base font-bold text-white font-mono mt-1">
                                            {kit.panels_count ?? "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-5 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-white/30 uppercase tracking-widest">
                                    <Battery className="w-3.5 h-3.5" /> Equipamentos
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Tipo de Sistema</span>
                                        <span className="text-white font-medium">{kit.system_type ?? "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Tipo de Inversor</span>
                                        <span className="text-white font-medium">{kit.equipment_type ?? "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Marca dos Painéis</span>
                                        <span className="text-white font-medium">{kit.panel_brand?.name ?? "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Marca do Inversor</span>
                                        <span className="text-white font-medium">{kit.equipment_brand?.name ?? "—"}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="glass-card p-6 text-center text-white/30 text-sm">
                            Nenhum kit associado a este orçamento.
                        </div>
                    )}
                </div>

                {/* ── Right Column — Financial ── */}
                <div className="space-y-4">
                    <div className="glass-card p-5 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white/30 uppercase tracking-widest">
                            <Clock className="w-3.5 h-3.5" /> Indicadores Financeiros
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-white/[0.05]">
                                <span className="text-sm text-white/50">Payback Estimado</span>
                                <span className="text-base font-bold text-amber-400 font-mono">
                                    {roi ? `${roi} anos` : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/[0.05]">
                                <span className="text-sm text-white/50">Economiza / Mês</span>
                                <span className="text-base font-bold text-emerald-400 font-mono">
                                    {formatCurrency(monthlySavings)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/[0.05]">
                                <span className="text-sm text-white/50">Economia em 25 anos</span>
                                <span className="text-base font-bold text-primary font-mono">
                                    {formatCurrency(savings25)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-white/50">Investimento Total</span>
                                <span className="text-base font-bold text-white font-mono">
                                    {formatCurrency(finalSystemPrice)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notas de instalação */}
                    {budget.installation_notes && (
                        <div className="glass-card p-5 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-white/30 uppercase tracking-widest">
                                <Shield className="w-3.5 h-3.5" /> Observações
                            </div>
                            <div
                                className="kit-rich-text kit-rich-text--compact text-sm text-white/50"
                                dangerouslySetInnerHTML={{ __html: budget.installation_notes }}
                            />
                        </div>
                    )}

                    {/* Link público */}
                    <div className="glass-card p-5 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white/30 uppercase tracking-widest">
                            <ExternalLink className="w-3.5 h-3.5" /> Link da Proposta
                        </div>
                        <p className="text-xs font-mono text-white/40 break-all">{publicUrl}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopyLink}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all border ${
                                    copied
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                        : "bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white"
                                }`}
                            >
                                {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? "Copiado!" : "Copiar"}
                            </button>
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Abrir
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
