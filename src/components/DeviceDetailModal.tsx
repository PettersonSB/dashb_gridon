import React, { useState, useEffect } from 'react';
import { Device, DeviceLog } from '@/lib/types';
import { deviceService } from '@/services/deviceService';
import {
    X, Zap, Activity, Gauge, Power, Wifi, WifiOff,
    Loader2, ChevronLeft, ChevronRight, BarChart3
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    CartesianGrid
} from 'recharts';

type HistoryRange = 'day' | 'week' | 'month' | 'year';

const RANGE_LABELS: Record<HistoryRange, string> = {
    day: 'Dia',
    week: 'Semana',
    month: 'Mês',
    year: 'Ano',
};

interface Props {
    device: Device;
    onClose: () => void;
}

// Agrupa os logs por período para exibição no gráfico
function aggregateLogs(logs: DeviceLog[], range: HistoryRange) {
    if (!logs.length) return [];

    const buckets: Record<string, { label: string; voltage: number[]; current: number[]; power: number[] }> = {};

    logs.forEach((log) => {
        // Formata a string para o formato ISO UTC caso o Supabase não retorne o timezone Z
        const dtStr = (!log.created_at.endsWith('Z') && !log.created_at.includes('+') && !log.created_at.match(/-\d{2}:\d{2}$/)) 
            ? log.created_at + 'Z' 
            : log.created_at;
            
        const d = new Date(dtStr);
        let key: string;
        let label: string;

        switch (range) {
            case 'day':
                key = `${d.getHours()}`;
                label = `${d.getHours().toString().padStart(2, '0')}h`;
                break;
            case 'week':
            case 'month':
                key = `${d.getDate()}/${d.getMonth() + 1}`;
                label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                break;
            case 'year':
                key = `${d.getMonth()}/${d.getFullYear()}`;
                const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                label = `${monthNames[d.getMonth()]}`;
                break;
        }

        if (!buckets[key]) {
            buckets[key] = { label, voltage: [], current: [], power: [] };
        }
        if (log.voltage != null) buckets[key].voltage.push(log.voltage);
        if (log.current != null) buckets[key].current.push(log.current);
        if (log.power != null) buckets[key].power.push(log.power);
    });

    return Object.values(buckets).map((b) => ({
        label: b.label,
        voltage: b.voltage.length ? +(b.voltage.reduce((a, c) => a + c, 0) / b.voltage.length).toFixed(1) : 0,
        current: b.current.length ? +(b.current.reduce((a, c) => a + c, 0) / b.current.length).toFixed(2) : 0,
        power: b.power.length ? +(b.power.reduce((a, c) => a + c, 0) / b.power.length).toFixed(1) : 0,
    }));
}

function formatPeriodLabel(start: Date, end: Date, range: HistoryRange) {
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    switch (range) {
        case 'day':
            return end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        case 'week':
            return `${start.toLocaleDateString('pt-BR', opts)} — ${end.toLocaleDateString('pt-BR', opts)}`;
        case 'month':
            return end.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        case 'year':
            return `${start.getFullYear()} — ${end.getFullYear()}`;
    }
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
        <div className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 shadow-xl text-sm">
            <p className="font-bold text-white mb-1">{data.label}</p>
            <p className="text-blue-400">⚡ Tensão: {data.voltage} V</p>
            <p className="text-cyan-400">🔌 Corrente: {data.current} A</p>
            <p className="text-amber-400">💡 Potência: {data.power} W</p>
        </div>
    );
};

export default function DeviceDetailModal({ device, onClose }: Props) {
    const [range, setRange] = useState<HistoryRange>('day');
    const [offset, setOffset] = useState(0);
    const [chartData, setChartData] = useState<any[]>([]);
    const [periodLabel, setPeriodLabel] = useState('');
    const [isLoadingChart, setIsLoadingChart] = useState(false);
    const [chartMetric, setChartMetric] = useState<'power' | 'voltage' | 'current'>('power');

    const isOnline = device.online === 'true';
    const isOn = device.is_on === true;

    useEffect(() => {
        loadHistory();
    }, [range, offset, device.device_id]);

    const loadHistory = async () => {
        setIsLoadingChart(true);
        try {
            const { logs, startDate, endDate } = await deviceService.getDeviceHistory(device.device_id, range, offset);
            const aggregated = aggregateLogs(logs, range);
            setChartData(aggregated);
            setPeriodLabel(formatPeriodLabel(startDate, endDate, range));
        } catch (e) {
            console.error('Erro ao carregar histórico:', e);
            setChartData([]);
        } finally {
            setIsLoadingChart(false);
        }
    };

    const metricColors: Record<string, string> = {
        power: '#EAB308',
        voltage: '#3B82F6',
        current: '#06B6D4',
    };

    const metricLabels: Record<string, string> = {
        power: 'Potência (W)',
        voltage: 'Tensão (V)',
        current: 'Corrente (A)',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#13151A] border border-white/10 rounded-2xl shadow-2xl custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-[#13151A] border-b border-white/[0.06] p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-400'}`} />
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-white truncate">{device.name || 'Dispositivo'}</h2>
                            <p className="text-xs text-white/30 font-mono truncate">{device.device_id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Real-time Metrics */}
                <div className="p-5">
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {/* Voltage */}
                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-2">
                                <Zap className="w-4 h-4 text-blue-400" />
                                <span className="text-[10px] text-blue-400/70 uppercase font-bold tracking-wider">Tensão</span>
                            </div>
                            <span className="text-2xl font-bold text-white">
                                {device.voltage != null ? `${device.voltage.toFixed(1)}` : '—'}
                            </span>
                            <span className="text-sm text-white/40 ml-1">V</span>
                        </div>
                        {/* Current */}
                        <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-2">
                                <Activity className="w-4 h-4 text-cyan-400" />
                                <span className="text-[10px] text-cyan-400/70 uppercase font-bold tracking-wider">Corrente</span>
                            </div>
                            <span className="text-2xl font-bold text-white">
                                {device.current != null ? `${device.current.toFixed(2)}` : '—'}
                            </span>
                            <span className="text-sm text-white/40 ml-1">A</span>
                        </div>
                        {/* Power */}
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-2">
                                <Power className="w-4 h-4 text-amber-400" />
                                <span className="text-[10px] text-amber-400/70 uppercase font-bold tracking-wider">Potência</span>
                            </div>
                            <span className="text-2xl font-bold text-white">
                                {device.power != null ? (device.power >= 1000 ? `${(device.power / 1000).toFixed(1)}` : `${device.power.toFixed(0)}`) : '—'}
                            </span>
                            <span className="text-sm text-white/40 ml-1">{device.power != null && device.power >= 1000 ? 'kW' : 'W'}</span>
                        </div>
                    </div>

                    {/* Status bar */}
                    <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-2.5 mb-6 border border-white/[0.04]">
                        <div className="flex items-center gap-2">
                            {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
                            <span className={`text-sm font-medium ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                        <span className={`text-sm font-medium ${isOn ? 'text-amber-400' : 'text-white/40'}`}>
                            {isOn ? '⚡ Ligado' : '○ Desligado'}
                        </span>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                        {/* Chart Header: Range tabs + Metric selector */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
                                {(['day', 'week', 'month', 'year'] as HistoryRange[]).map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => { setRange(r); setOffset(0); }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            range === r
                                                ? 'bg-primary/20 text-primary'
                                                : 'text-white/40 hover:text-white/60'
                                        }`}
                                    >
                                        {RANGE_LABELS[r]}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
                                {(['power', 'voltage', 'current'] as const).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setChartMetric(m)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            chartMetric === m
                                                ? `text-white`
                                                : 'text-white/40 hover:text-white/60'
                                        }`}
                                        style={chartMetric === m ? { backgroundColor: metricColors[m] + '33' } : {}}
                                    >
                                        {m === 'power' ? 'Potência' : m === 'voltage' ? 'Tensão' : 'Corrente'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setOffset((o) => o + 1)}
                                className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                            >
                                <ChevronLeft className="w-4 h-4" /> Anterior
                            </button>
                            <span className="text-sm text-white/70 font-medium capitalize">{periodLabel}</span>
                            <button
                                onClick={() => setOffset((o) => Math.max(0, o - 1))}
                                disabled={offset === 0}
                                className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Próximo <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Chart */}
                        {isLoadingChart ? (
                            <div className="flex items-center justify-center h-52">
                                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            </div>
                        ) : chartData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-52 text-white/30">
                                <BarChart3 className="w-10 h-10 mb-2 text-white/10" />
                                <p className="text-sm">Sem dados para este período</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                                        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                                        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                    <Bar dataKey={chartMetric} radius={[6, 6, 0, 0]} maxBarSize={40}>
                                        {chartData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={metricColors[chartMetric]} fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}

                        {/* Legend */}
                        <div className="text-center mt-2">
                            <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
                                {metricLabels[chartMetric]} — Média por período
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
