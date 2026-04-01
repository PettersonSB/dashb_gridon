import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, ExternalLink, Copy, CheckCheck, Smartphone, Monitor, Loader2 } from "lucide-react";

const BUDGET_BASE_URL = "http://gridon.com.br/orcamento";

export default function BudgetPreview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
    const [iframeLoaded, setIframeLoaded] = useState(false);

    const publicUrl = `${BUDGET_BASE_URL}/${id}`;
    const previewUrl = `${publicUrl}?preview=true`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="animate-fade-in flex flex-col h-[calc(100vh-4rem)]">
            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap px-2 py-4 flex-shrink-0">
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

                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 gap-0.5">
                        <button
                            onClick={() => { setViewMode('mobile'); setIframeLoaded(false); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                viewMode === 'mobile'
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'text-white/40 hover:text-white/70'
                            }`}
                        >
                            <Smartphone className="w-3.5 h-3.5" />
                            Mobile
                        </button>
                        <button
                            onClick={() => { setViewMode('desktop'); setIframeLoaded(false); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                viewMode === 'desktop'
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'text-white/40 hover:text-white/70'
                            }`}
                        >
                            <Monitor className="w-3.5 h-3.5" />
                            Desktop
                        </button>
                    </div>

                    {/* Copy Link */}
                    <button
                        onClick={handleCopyLink}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                            copied
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white hover:border-white/20"
                        }`}
                    >
                        {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copiado!" : "Copiar link"}
                    </button>

                    {/* Open External */}
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

            {/* ── Iframe Preview ── */}
            <div className="flex-1 flex items-start justify-center overflow-hidden pb-4 px-4">
                <div
                    className={`relative transition-all duration-500 ease-in-out h-full ${
                        viewMode === 'mobile'
                            ? 'w-[430px]'
                            : 'w-full max-w-[1400px]'
                    }`}
                >
                    {/* Phone Frame (mobile only) */}
                    <div className={`h-full rounded-2xl overflow-hidden transition-all duration-500 ${
                        viewMode === 'mobile'
                            ? 'border-[3px] border-white/[0.12] shadow-[0_0_60px_rgba(0,0,0,0.5),0_0_20px_rgba(var(--primary-rgb,56,189,248),0.08)] bg-black'
                            : 'border border-white/[0.06] shadow-2xl bg-black'
                    }`}>
                        {/* Notch (mobile only) */}
                        {viewMode === 'mobile' && (
                            <div className="h-7 bg-black flex items-center justify-center relative z-10">
                                <div className="w-28 h-5 bg-black rounded-b-2xl border-b border-x border-white/[0.08]" />
                            </div>
                        )}

                        {/* Loading Spinner */}
                        {!iframeLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    <span className="text-xs text-white/40 font-medium">Carregando prévia...</span>
                                </div>
                            </div>
                        )}

                        {/* Iframe */}
                        <iframe
                            src={previewUrl}
                            className={`w-full bg-white transition-opacity duration-300 ${
                                iframeLoaded ? 'opacity-100' : 'opacity-0'
                            } ${viewMode === 'mobile' ? 'h-[calc(100%-1.75rem)]' : 'h-full'}`}
                            onLoad={() => setIframeLoaded(true)}
                            title="Prévia do Orçamento"
                        />
                    </div>

                    {/* Mode Label */}
                    <div className="absolute -bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-white/20 font-medium uppercase tracking-widest">
                        {viewMode === 'mobile' ? '430px — Visualização Mobile' : 'Visualização Desktop'}
                    </div>
                </div>
            </div>
        </div>
    );
}
