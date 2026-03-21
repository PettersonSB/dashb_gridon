import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
    X,
    BarChart2,
    Loader2,
    Monitor,
    Smartphone,
    Tablet,
    Globe,
    MousePointer2,
    Clock,
    Eye,
    Scroll,
    Zap,
    ExternalLink,
    MessageCircle,
    Volume2,
    Video,
    Wifi,
    Activity,
    CalendarDays,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────
interface BudgetSession {
    id: string;
    budget_id: string;
    device_type: string;
    browser: string;
    os: string;
    referrer: string;
    referrer_url: string;
    started_at: string;
    last_seen_at: string;
    duration_seconds: number;
    page_views: number;
    max_scroll_pct: number;
    cta_clicks: Record<string, number>;
    external_link_clicks: number;
}

interface AnalyticsModalProps {
    budgetId: string;
    customerName: string;
    onClose: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────
const fmtDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
};

const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const TABS = ["Visão Geral", "Dispositivos", "Tráfego", "CTAs", "Sessões"] as const;
type Tab = typeof TABS[number];

// ─── AnalyticsModal Component ────────────────────────────────────────────
export default function AnalyticsModal({ budgetId, customerName, onClose }: AnalyticsModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>("Visão Geral");
    const [sessions, setSessions] = useState<BudgetSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [liveCount, setLiveCount] = useState(0);
    const [maxAudioPct, setMaxAudioPct] = useState(0);
    const [maxVideoPct, setMaxVideoPct] = useState(0);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const eventsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // ─── Load initial data ───────────────────────────────────────────
    const fetchSessions = async () => {
        const { data } = await supabase
            .from("budget_sessions")
            .select("*")
            .eq("budget_id", budgetId)
            .order("started_at", { ascending: false });
        if (data) setSessions(data as BudgetSession[]);
        setIsLoading(false);
    };

    const fetchMediaEvents = async () => {
        // Fetch audio progress
        const { data: audioData } = await supabase
            .from("budget_events")
            .select("event_data")
            .eq("budget_id", budgetId)
            .eq("event_type", "audio_progress");
        
        if (audioData && audioData.length > 0) {
            const maxPct = Math.max(...audioData.map(e => (e.event_data as any)?.milestone || 0));
            if (isFinite(maxPct)) setMaxAudioPct(maxPct);
        }

        // Fetch video progress
        const { data: videoData } = await supabase
            .from("budget_events")
            .select("event_data")
            .eq("budget_id", budgetId)
            .eq("event_type", "video_progress");
        
        if (videoData && videoData.length > 0) {
            const maxPct = Math.max(...videoData.map(e => (e.event_data as any)?.milestone || 0));
            if (isFinite(maxPct)) setMaxVideoPct(maxPct);
        }
    };

    // ─── Realtime subscription ───────────────────────────────────────
    useEffect(() => {
        fetchSessions();
        fetchMediaEvents();

        channelRef.current = supabase
            .channel(`analytics-${budgetId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "budget_sessions",
                    filter: `budget_id=eq.${budgetId}`,
                },
                () => {
                    fetchSessions();
                }
            )
            .subscribe();

        eventsChannelRef.current = supabase
            .channel(`analytics-events-${budgetId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "budget_events",
                    filter: `budget_id=eq.${budgetId}`,
                },
                () => {
                    fetchMediaEvents();
                }
            )
            .subscribe();

        const liveInterval = setInterval(() => {
            const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
            const live = sessions.filter(s => s.last_seen_at > twoMinAgo).length;
            setLiveCount(live);
        }, 5000);

        return () => {
            channelRef.current?.unsubscribe();
            eventsChannelRef.current?.unsubscribe();
            clearInterval(liveInterval);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [budgetId]);

    // ─── Computed metrics ────────────────────────────────────────────
    const totalPageViews = sessions.reduce((a, s) => a + (s.page_views || 1), 0);
    const avgDuration = sessions.length
        ? Math.round(sessions.reduce((a, s) => a + (s.duration_seconds || 0), 0) / sessions.length)
        : 0;
    const totalExternalClicks = sessions.reduce((a, s) => a + (s.external_link_clicks || 0), 0);
    const totalCtaClicks = sessions.reduce((a, s) => {
        return a + Object.values(s.cta_clicks || {}).reduce((x, v) => x + v, 0);
    }, 0);
    const maxScroll = sessions.length
        ? Math.max(...sessions.map(s => s.max_scroll_pct || 0))
        : 0;

    // ─── Device stats ────────────────────────────────────────────────
    const deviceCount = { desktop: 0, mobile: 0, tablet: 0 };
    const browserCount: Record<string, number> = {};
    sessions.forEach(s => {
        const d = (s.device_type || "desktop") as keyof typeof deviceCount;
        if (d in deviceCount) deviceCount[d]++;
        const b = s.browser || "Other";
        browserCount[b] = (browserCount[b] || 0) + 1;
    });

    // ─── Traffic sources ─────────────────────────────────────────────
    const trafficCount: Record<string, number> = {};
    sessions.forEach(s => {
        const src = s.referrer || "direct";
        trafficCount[src] = (trafficCount[src] || 0) + 1;
    });
    const trafficMax = Math.max(1, ...Object.values(trafficCount));

    // ─── CTA clicks aggregated ───────────────────────────────────────
    const allCTAs: Record<string, number> = {};
    sessions.forEach(s => {
        Object.entries(s.cta_clicks || {}).forEach(([k, v]) => {
            allCTAs[k] = (allCTAs[k] || 0) + v;
        });
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col
                bg-white dark:bg-[#0d1117]
                border border-slate-200 dark:border-white/10
                rounded-2xl shadow-2xl overflow-hidden
                animate-in slide-in-from-bottom-4 duration-300">

                {/* ── Header ── */}
                <div className="flex items-start justify-between px-6 py-5
                    border-b border-slate-200 dark:border-white/[0.06]
                    bg-slate-50 dark:bg-white/[0.02]
                    flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                            <BarChart2 className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-slate-900 dark:text-white font-bold text-lg">Analytics da Proposta</h2>
                                {liveCount > 0 && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
                                        <Wifi className="w-2.5 h-2.5" /> AO VIVO
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-500 dark:text-white/40 text-xs font-mono mt-0.5">
                                {customerName} — ID: {budgetId.slice(0, 8).toUpperCase()}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors
                            text-slate-400 hover:text-slate-700 hover:bg-slate-100
                            dark:text-white/40 dark:hover:text-white dark:hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Tabs ── */}
                <div className="flex border-b border-slate-200 dark:border-white/[0.06] flex-shrink-0 overflow-x-auto no-scrollbar bg-white dark:bg-transparent">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${activeTab === tab
                                ? "text-violet-600 dark:text-violet-400 border-violet-500 bg-violet-50 dark:bg-violet-400/5"
                                : "text-slate-500 dark:text-white/40 border-transparent hover:text-slate-700 dark:hover:text-white/70 hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-transparent">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="w-6 h-6 animate-spin text-violet-500 dark:text-violet-400" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <Activity className="w-10 h-10 text-slate-300 dark:text-white/20" />
                            <p className="text-slate-500 dark:text-white/40 text-sm">Nenhuma visita registrada ainda.</p>
                            <p className="text-slate-400 dark:text-white/20 text-xs">Os dados aparecem assim que o link for aberto.</p>
                        </div>
                    ) : (
                        <>
                            {/* ═══ TAB 1 — VISÃO GERAL ═══════════════════════════════════════ */}
                            {activeTab === "Visão Geral" && (
                                <div className="space-y-6">
                                    {/* Row 1 */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <MetricCard
                                            icon={<Eye className="w-4 h-4 text-blue-500" />}
                                            label="Page Views"
                                            value={totalPageViews.toString()}
                                            sub="Total de Visualizações"
                                            color="blue"
                                        />
                                        <MetricCard
                                            icon={<Clock className="w-4 h-4 text-amber-500" />}
                                            label="Tempo Médio"
                                            value={fmtDuration(avgDuration)}
                                            sub="Duração média da visita"
                                            color="amber"
                                        />
                                        <MetricCard
                                            icon={<ExternalLink className="w-4 h-4 text-cyan-500" />}
                                            label="Cliques Externos"
                                            value={totalExternalClicks.toString()}
                                            sub="Links externos"
                                            color="cyan"
                                        />
                                        <MetricCard
                                            icon={<MousePointer2 className="w-4 h-4 text-violet-500" />}
                                            label="Cliques em CTAs"
                                            value={totalCtaClicks.toString()}
                                            sub="Total de CTAs acionados"
                                            color="violet"
                                        />
                                    </div>

                                    {/* Row 2 — Engajamento */}
                                    <div>
                                        <p className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-widest mb-3">Engajamento do Usuário</p>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Scroll className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-xs text-slate-500 dark:text-white/50">Profundidade de Scroll</span>
                                                </div>
                                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{maxScroll}%</p>
                                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                                                    {maxScroll >= 90 ? "Excelente engajamento" : maxScroll >= 50 ? "Bom engajamento" : "Baixo engajamento"}
                                                </p>
                                            </div>
                                            <EngagementCard
                                                icon={<Volume2 className="w-4 h-4 text-purple-500" />}
                                                label="Áudio – Orçamento"
                                                pct={maxAudioPct}
                                                sub={maxAudioPct > 0 ? "Ouvido pelo cliente" : "Ainda não ouvido"}
                                            />
                                            <PlaceholderEngagementCard
                                                icon={<Volume2 className="w-4 h-4 text-pink-500" />}
                                                label="Áudio – Serviços"
                                                pct={0}
                                                sub="Baixa audiência"
                                            />
                                            <EngagementCard
                                                icon={<Video className="w-4 h-4 text-orange-500" />}
                                                label="Progresso de Vídeo"
                                                pct={maxVideoPct}
                                                sub={maxVideoPct > 0 ? "Assistido pelo cliente" : "Ainda não assistido"}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═══ TAB 2 — DISPOSITIVOS ═══════════════════════════════════════ */}
                            {activeTab === "Dispositivos" && (
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-widest mb-3">Distribuição por Dispositivos</p>
                                        <div className="grid grid-cols-3 gap-4">
                                            <DeviceCard
                                                icon={<Monitor className="w-6 h-6 text-blue-500" />}
                                                label="Desktop"
                                                count={deviceCount.desktop}
                                                sub="Acessos via computador"
                                                total={sessions.length}
                                                color="blue"
                                            />
                                            <DeviceCard
                                                icon={<Smartphone className="w-6 h-6 text-emerald-500" />}
                                                label="Mobile"
                                                count={deviceCount.mobile}
                                                sub="Acessos via celular"
                                                total={sessions.length}
                                                color="emerald"
                                            />
                                            <DeviceCard
                                                icon={<Tablet className="w-6 h-6 text-amber-500" />}
                                                label="Tablet"
                                                count={deviceCount.tablet}
                                                sub="Acessos via tablet"
                                                total={sessions.length}
                                                color="amber"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-widest mb-3">Navegadores Utilizados</p>
                                        <div className="flex flex-wrap gap-3">
                                            {Object.entries(browserCount).sort((a, b) => b[1] - a[1]).map(([browser, count]) => (
                                                <div key={browser} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
                                                    <Globe className="w-4 h-4 text-slate-400 dark:text-white/40" />
                                                    <span className="text-sm text-slate-700 dark:text-white font-medium">{browser}</span>
                                                    <span className="text-xs text-slate-400 dark:text-white/40 font-mono">{count}x</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═══ TAB 3 — TRÁFEGO ═══════════════════════════════════════ */}
                            {activeTab === "Tráfego" && (
                                <div className="space-y-3">
                                    <p className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-widest mb-4">Fontes de Tráfego</p>
                                    {Object.entries(trafficCount)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([source, count]) => (
                                            <div key={source} className="flex items-center gap-4">
                                                <div className="flex items-center gap-2 w-28 flex-shrink-0">
                                                    <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-white/30" />
                                                    <span className="text-sm text-slate-700 dark:text-white capitalize">{source}</span>
                                                </div>
                                                <div className="flex-1 h-2 bg-slate-200 dark:bg-white/[0.05] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-violet-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${(count / trafficMax) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-mono text-slate-500 dark:text-white/60 w-8 text-right">{count}</span>
                                            </div>
                                        ))}
                                    {Object.keys(trafficCount).length === 0 && (
                                        <p className="text-slate-400 dark:text-white/30 text-sm">Sem dados de tráfego ainda.</p>
                                    )}
                                </div>
                            )}

                            {/* ═══ TAB 4 — CTAs ══════════════════════════════════════════ */}
                            {activeTab === "CTAs" && (
                                <div className="space-y-3">
                                    <p className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-widest mb-4">Cliques em CTAs</p>
                                    {Object.entries(allCTAs).sort((a, b) => b[1] - a[1]).map(([cta, count]) => (
                                        <div key={cta} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                                    {cta === 'whatsapp'
                                                        ? <MessageCircle className="w-4 h-4 text-emerald-500" />
                                                        : cta === 'phone'
                                                            ? <Zap className="w-4 h-4 text-amber-500" />
                                                            : <MousePointer2 className="w-4 h-4 text-violet-500" />
                                                    }
                                                </div>
                                                <span className="text-sm text-slate-700 dark:text-white capitalize font-medium">{cta}</span>
                                            </div>
                                            <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">{count}</span>
                                        </div>
                                    ))}
                                    {Object.keys(allCTAs).length === 0 && (
                                        <p className="text-slate-400 dark:text-white/30 text-sm">Nenhum CTA clicado ainda.</p>
                                    )}
                                </div>
                            )}

                            {/* ═══ TAB 5 — SESSÕES ══════════════════════════════════════════ */}
                            {activeTab === "Sessões" && (
                                <div className="space-y-3">
                                    <p className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-widest mb-4">Sessões Iniciadas Recentes</p>
                                    <div className="space-y-2">
                                        {sessions.map(s => {
                                            const isLive = new Date(s.last_seen_at) > new Date(Date.now() - 2 * 60 * 1000);
                                            const ctaTotal = Object.values(s.cta_clicks || {}).reduce((a, v) => a + v, 0);
                                            return (
                                                <div key={s.id} className={`p-4 rounded-xl border transition-all ${isLive
                                                    ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5'
                                                    : 'border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]'
                                                    }`}>
                                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                                        <div className="flex items-center gap-2">
                                                            {isLive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />}
                                                            <CalendarDays className="w-3.5 h-3.5 text-slate-400 dark:text-white/30 flex-shrink-0" />
                                                            <span className="text-xs text-slate-500 dark:text-white/60 font-mono">{fmtDate(s.started_at)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {s.device_type === 'desktop' && <Monitor className="w-3.5 h-3.5 text-blue-500" />}
                                                            {s.device_type === 'mobile' && <Smartphone className="w-3.5 h-3.5 text-emerald-500" />}
                                                            {s.device_type === 'tablet' && <Tablet className="w-3.5 h-3.5 text-amber-500" />}
                                                            <span className="text-xs text-slate-500 dark:text-white/50 capitalize">{s.device_type}</span>
                                                            <span className="text-slate-300 dark:text-white/20 mx-1">·</span>
                                                            <Globe className="w-3 h-3 text-slate-400 dark:text-white/30" />
                                                            <span className="text-xs text-slate-400 dark:text-white/40">{s.browser}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 mt-3">
                                                        <Pill icon={<Clock className="w-3 h-3" />} label="Duração" value={fmtDuration(s.duration_seconds || 0)} />
                                                        <Pill icon={<Eye className="w-3 h-3" />} label="Page Views" value={(s.page_views || 1).toString()} />
                                                        <Pill icon={<Scroll className="w-3 h-3" />} label="Scroll" value={`${s.max_scroll_pct || 0}%`} />
                                                        <Pill icon={<MousePointer2 className="w-3 h-3" />} label="Cliques" value={ctaTotal.toString()} />
                                                        <Pill icon={<Globe className="w-3 h-3" />} label="Fonte" value={s.referrer || "direct"} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Sub-Components ──────────────────────────────────────────────────────
function MetricCard({ icon, label, value, sub, color }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub: string;
    color: string;
}) {
    const colorMap: Record<string, string> = {
        blue: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
        amber: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
        cyan: "bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
        violet: "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
        emerald: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    };
    return (
        <div className={`rounded-xl p-4 border ${colorMap[color] || "bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08]"}`}>
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <span className="text-xs text-slate-500 dark:text-white/50">{label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{value}</p>
            <p className="text-[11px] text-slate-400 dark:text-white/30 mt-1">{sub}</p>
        </div>
    );
}

function PlaceholderEngagementCard({ icon, label, pct, sub }: {
    icon: React.ReactNode;
    label: string;
    pct: number;
    sub: string;
}) {
    return (
        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-300 dark:text-white/15 font-semibold uppercase tracking-widest rotate-[-20deg]">Em breve</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <span className="text-xs text-slate-400 dark:text-white/40">{label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-300 dark:text-white/30 font-mono">Máximo {pct}%</p>
            <p className="text-[11px] text-slate-300 dark:text-white/20 mt-1">{sub}</p>
        </div>
    );
}

function EngagementCard({ icon, label, pct, sub }: {
    icon: React.ReactNode;
    label: string;
    pct: number;
    sub: string;
}) {
    return (
        <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <span className="text-xs text-slate-500 dark:text-white/50">{label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{pct}%</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">{sub}</p>
        </div>
    );
}

function DeviceCard({ icon, label, count, sub, total, color }: {
    icon: React.ReactNode;
    label: string;
    count: number;
    sub: string;
    total: number;
    color: string;
}) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    const colorMap: Record<string, string> = {
        blue: "bg-blue-500",
        emerald: "bg-emerald-500",
        amber: "bg-amber-500",
    };
    return (
        <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 text-center">
            <div className="flex justify-center mb-3">{icon}</div>
            <p className="text-sm text-slate-500 dark:text-white/60 font-medium mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono">{count}</p>
            <p className="text-[11px] text-slate-400 dark:text-white/30 mt-1">{sub}</p>
            <div className="mt-3 h-1 bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorMap[color] || "bg-violet-500"} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-white/20 mt-1 font-mono">{pct}% do total</p>
        </div>
    );
}

function Pill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-white/50">
            {icon}
            <span className="text-[11px]">{label}:</span>
            <span className="text-[11px] text-slate-700 dark:text-white font-medium">{value}</span>
        </div>
    );
}
