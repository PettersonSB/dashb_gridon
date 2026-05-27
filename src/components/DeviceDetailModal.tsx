import React, { useState, useEffect } from 'react';
import { Device, DeviceLog } from '@/lib/types';
import { deviceService } from '@/services/deviceService';
import { useQueryClient } from '@tanstack/react-query';
import { emitToast } from '@/components/ui/Toaster';
import {
    X, Zap, Activity, Gauge, Power, Wifi, WifiOff,
    Loader2, ChevronLeft, ChevronRight, BarChart3, Sun, Settings
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

// Agrupa os logs por período para exibição no gráfico
function aggregateLogs(logs: DeviceLog[], range: HistoryRange, phaseConfig: any) {
    if (!logs.length) return [];

    const buckets: Record<string, { 
        label: string; 
        voltage: number[]; 
        current: number[]; 
        power: number[]; 
        generation: number[]; 
        consumption: number[]; 
    }> = {};

    logs.forEach((log) => {
        const dtStr = log.created_at.includes('.') ? log.created_at.split('.')[0] : log.created_at;
        let isoStr = dtStr;
        if (isoStr.endsWith('Z')) {
            isoStr = isoStr.slice(0, -1);
        }

        const d = new Date(isoStr);
        let key: string;
        let label: string;

        switch (range) {
            case 'day': {
                const hh = d.getHours().toString().padStart(2, '0');
                const mm = d.getMinutes() >= 30 ? '30' : '00';
                key = `${hh}:${mm}`;
                label = `${hh}:${mm}h`;
                break;
            }
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
            buckets[key] = { label, voltage: [], current: [], power: [], generation: [], consumption: [] };
        }
        
        if (log.voltage != null) buckets[key].voltage.push(log.voltage);
        if (log.current != null) buckets[key].current.push(log.current);
        if (log.power != null) buckets[key].power.push(log.power);

        // Agrega geração e consumo para multi-fase ou resumo diário/mensal
        const rawLog = log as any;
        if (range === 'month' || range === 'year') {
            // No resumo diário/mensal, d.generation e d.consumption já vêm em kWh
            if (rawLog.generation != null) buckets[key].generation.push(rawLog.generation);
            if (rawLog.consumption != null) buckets[key].consumption.push(rawLog.consumption);
        } else {
            // Em dados brutos (logs de tempo real), calculamos a potência de geração e consumo instantâneo em Watts
            let genPower = 0;
            let conPower = 0;
            const phases = log.telemetry_data?.phases;
            if (phases) {
                Object.keys(phases).forEach((pKey) => {
                    const phase = (phases as any)[pKey];
                    if (phase) {
                        const role = phaseConfig?.[pKey] ?? (pKey === 'a' ? 'generation' : pKey === 'b' ? 'consumption' : 'none');
                        const p = phase.power ?? 0;
                        if (role === 'generation') {
                            genPower += Math.abs(p);
                        } else if (role === 'consumption') {
                            conPower += Math.abs(p);
                        }
                    }
                });
            } else {
                // Fallback para dispositivo legado
                const p = log.power ?? 0;
                if (p >= 0) {
                    conPower = p;
                } else {
                    genPower = Math.abs(p);
                }
            }
            buckets[key].generation.push(genPower);
            buckets[key].consumption.push(conPower);
        }
    });

    return Object.values(buckets).map((b) => {
        const isEnergySum = range === 'month' || range === 'year';
        const sumGen = b.generation.reduce((a, c) => a + c, 0);
        const sumCon = b.consumption.reduce((a, c) => a + c, 0);

        return {
            label: b.label,
            voltage: b.voltage.length ? +(b.voltage.reduce((a, c) => a + c, 0) / b.voltage.length).toFixed(1) : 0,
            current: b.current.length ? +(b.current.reduce((a, c) => a + c, 0) / b.current.length).toFixed(2) : 0,
            power: b.power.length ? +(b.power.reduce((a, c) => a + c, 0) / b.power.length).toFixed(1) : 0,
            generation: b.generation.length ? +(isEnergySum ? sumGen : sumGen / b.generation.length).toFixed(1) : 0,
            consumption: b.consumption.length ? +(isEnergySum ? sumCon : sumCon / b.consumption.length).toFixed(1) : 0,
        };
    });
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

interface Props {
    device: Device;
    onClose: () => void;
}

export default function DeviceDetailModal({ device, onClose }: Props) {
    const queryClient = useQueryClient();
    const [range, setRange] = useState<HistoryRange>('day');
    const [offset, setOffset] = useState(0);
    const [chartData, setChartData] = useState<any[]>([]);
    const [periodLabel, setPeriodLabel] = useState('');
    const [isLoadingChart, setIsLoadingChart] = useState(false);
    const [chartMetric, setChartMetric] = useState<'power' | 'voltage' | 'current'>('power');

    // Mapeamento de TCs dinâmicos
    const [phaseConfig, setPhaseConfig] = useState<any>(device.phase_config || { a: 'generation', b: 'consumption', c: 'none' });
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    const isOnline = device.online === 'true';

    // Multiphase checking
    const phases = device.telemetry_data?.phases;
    const hasMultiphase = !!phases && Object.keys(phases).length > 0;

    const isOn = isOnline && (
        device.is_on === true ||
        hasMultiphase ||
        (device.power != null && Math.abs(device.power) > 2)
    );

    // Calcular valores de Geração e Consumo instantâneos para exibição
    let genPower = 0;
    let conPower = 0;
    if (hasMultiphase && phases) {
        Object.keys(phases).forEach((pKey) => {
            const phase = (phases as any)[pKey];
            if (phase) {
                const role = phaseConfig?.[pKey] ?? (pKey === 'a' ? 'generation' : pKey === 'b' ? 'consumption' : 'none');
                const p = phase.power ?? 0;
                if (role === 'generation') {
                    genPower += Math.abs(p);
                } else if (role === 'consumption') {
                    conPower += Math.abs(p);
                }
            }
        });
    }

    useEffect(() => {
        loadHistory();
    }, [range, offset, device.device_id, phaseConfig]);

    const loadHistory = async () => {
        setIsLoadingChart(true);
        try {
            const { logs, startDate, endDate } = await deviceService.getDeviceHistory(device.device_id, range, offset);
            const aggregated = aggregateLogs(logs, range, phaseConfig);
            setChartData(aggregated);
            setPeriodLabel(formatPeriodLabel(startDate, endDate, range));
        } catch (e) {
            console.error('Erro ao carregar histórico:', e);
            setChartData([]);
        } finally {
            setIsLoadingChart(false);
        }
    };

    const handleSaveConfig = async () => {
        setIsSavingConfig(true);
        try {
            await deviceService.updatePhaseConfig(device.id, phaseConfig);
            await queryClient.invalidateQueries({ queryKey: ['devices'] });
            emitToast({
                title: 'Mapeamento salvo!',
                description: 'Mapeamento de TCs atualizado com sucesso no Supabase.',
            });
        } catch (e) {
            console.error(e);
            emitToast({
                title: 'Erro ao salvar',
                description: 'Não foi possível salvar o mapeamento de TCs.',
                variant: 'destructive',
            });
        } finally {
            setIsSavingConfig(false);
        }
    };

    const metricColors: Record<string, string> = {
        power: '#EAB308',
        voltage: '#3B82F6',
        current: '#06B6D4',
    };

    const metricLabels: Record<string, string> = {
        power: range === 'month' || range === 'year' ? 'Geração/Consumo (kWh)' : 'Potência (W)',
        voltage: 'Tensão (V)',
        current: 'Corrente (A)',
    };

    // Tooltip customizado que lê Geração vs Consumo
    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null;
        const data = payload[0].payload;
        const isEnergy = range === 'month' || range === 'year';
        const unit = isEnergy ? 'kWh' : 'W';

        return (
            <div className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 shadow-xl text-sm">
                <p className="font-bold text-white mb-1.5">{data.label}</p>
                {hasMultiphase && chartMetric === 'power' ? (
                    <>
                        <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
                            ☀️ Geração: {data.generation} {unit}
                        </p>
                        <p className="text-blue-400 font-semibold flex items-center gap-1.5">
                            🔌 Consumo: {data.consumption} {unit}
                        </p>
                        {!isEnergy && (
                            <p className="text-white/60 text-xs border-t border-white/10 mt-1.5 pt-1.5 font-mono">
                                Saldo: {(data.generation - data.consumption).toFixed(1)} W
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        {chartMetric === 'power' && (
                            <p className="text-amber-400">💡 Potência Média: {data.power} W</p>
                        )}
                        {chartMetric === 'voltage' && (
                            <p className="text-blue-400">⚡ Tensão: {data.voltage} V</p>
                        )}
                        {chartMetric === 'current' && (
                            <p className="text-cyan-400">🔌 Corrente: {data.current} A</p>
                        )}
                    </>
                )}
            </div>
        );
    };

    // Define se deve exibir duas barras (Geração vs Consumo)
    const showDoubleBars = hasMultiphase && chartMetric === 'power';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#13151A] border border-white/10 rounded-2xl shadow-2xl custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-[#13151A] border-b border-white/[0.06] p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
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
                    {hasMultiphase ? (
                        /* Geração vs Consumo Multi-fase boxes */
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-2">
                                    <Sun className="w-4 h-4 text-emerald-400" />
                                    <span className="text-[10px] text-emerald-400/70 uppercase font-bold tracking-wider">Geração Solar</span>
                                </div>
                                <span className="text-2xl font-bold text-emerald-400">
                                    {isOnline ? (genPower >= 1000 ? (genPower / 1000).toFixed(2) : genPower.toFixed(0)) : '—'}
                                </span>
                                <span className="text-sm text-[#718096] ml-1">{genPower >= 1000 ? 'kW' : 'W'}</span>
                            </div>
                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-2">
                                    <Zap className="w-4 h-4 text-blue-400" />
                                    <span className="text-[10px] text-blue-400/70 uppercase font-bold tracking-wider">Consumo Rede</span>
                                </div>
                                <span className="text-2xl font-bold text-blue-400">
                                    {isOnline ? (conPower >= 1000 ? (conPower / 1000).toFixed(2) : conPower.toFixed(0)) : '—'}
                                </span>
                                <span className="text-sm text-[#718096] ml-1">{conPower >= 1000 ? 'kW' : 'W'}</span>
                            </div>
                        </div>
                    ) : (
                        /* Legacy Single-Phase layout */
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-2">
                                    <Zap className="w-4 h-4 text-blue-400" />
                                    <span className="text-[10px] text-blue-400/70 uppercase font-bold tracking-wider">Tensão</span>
                                </div>
                                <span className="text-2xl font-bold text-white">
                                    {isOnline && device.voltage != null ? `${device.voltage.toFixed(1)}` : '—'}
                                </span>
                                <span className="text-sm text-white/40 ml-1">V</span>
                            </div>
                            <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-2">
                                    <Activity className="w-4 h-4 text-cyan-400" />
                                    <span className="text-[10px] text-cyan-400/70 uppercase font-bold tracking-wider">Corrente</span>
                                </div>
                                <span className="text-2xl font-bold text-white">
                                    {isOnline && device.current != null ? `${device.current.toFixed(2)}` : '—'}
                                </span>
                                <span className="text-sm text-white/40 ml-1">A</span>
                            </div>
                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-2">
                                    <Power className="w-4 h-4 text-amber-400" />
                                    <span className="text-[10px] text-amber-400/70 uppercase font-bold tracking-wider">Potência</span>
                                </div>
                                <span className="text-2xl font-bold text-white">
                                    {isOnline && device.power != null ? (device.power >= 1000 ? `${(device.power / 1000).toFixed(1)}` : `${device.power.toFixed(0)}`) : '—'}
                                </span>
                                <span className="text-sm text-white/40 ml-1">{isOnline && device.power != null && device.power >= 1000 ? 'kW' : 'W'}</span>
                            </div>
                        </div>
                    )}

                    {/* Status bar */}
                    <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-2.5 mb-6 border border-white/[0.04]">
                        <div className="flex items-center gap-2">
                            {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />}
                            <span className={`text-sm font-semibold ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isOnline ? 'Online' : 'Conexão perdida com o Tuya'}
                            </span>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isOn && isOnline ? 'bg-amber-400/10 text-amber-400' : 'bg-white/5 text-white/30'}`}>
                            {isOn && isOnline ? '⚡ Ligado' : '○ Desligado'}
                        </span>
                    </div>

                    {/* Phase-specific grid for Multiphase devices */}
                    {hasMultiphase && phases && (
                        <div className="mb-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 animate-fade-in">
                            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest block mb-3">Leituras por Fase / Canal</span>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {Object.entries(phases).map(([key, ph]: any) => (
                                    <div key={key} className="bg-[#181A20] rounded-xl border border-white/[0.04] p-3 flex flex-col gap-2">
                                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
                                            <span className="uppercase text-[#00C2FF] font-bold text-xs">Fase {key}</span>
                                            {ph.power != null && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                                    ph.power < 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                    {ph.power < 0 ? 'Geração' : 'Consumo'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] font-mono text-white/60">
                                            <span>Tensão:</span>
                                            <span className="text-right text-white font-semibold">{ph.voltage != null ? `${ph.voltage.toFixed(1)} V` : '—'}</span>
                                            
                                            <span>Corrente:</span>
                                            <span className="text-right text-white font-semibold">{ph.current != null ? `${ph.current.toFixed(2)} A` : '—'}</span>
                                            
                                            <span>Potência:</span>
                                            <span className="text-right text-white font-semibold">{ph.power != null ? `${Math.abs(ph.power).toFixed(0)} W` : '—'}</span>
                                            
                                            <span>Fat. Potência:</span>
                                            <span className="text-right text-white font-semibold">{ph.power_factor != null ? ph.power_factor.toFixed(2) : '—'}</span>
                                        </div>
                                        {/* Energias Acumuladas */}
                                        <div className="border-t border-white/[0.04] pt-2 mt-1 space-y-1 text-[9px] text-white/40 font-mono">
                                            <div className="flex justify-between">
                                                <span>Total Geração:</span>
                                                <span className="text-emerald-400">{ph.forward_energy != null ? `${ph.forward_energy.toFixed(1)} kWh` : '—'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Total Consumo:</span>
                                                <span className="text-blue-400">{ph.reverse_energy != null ? `${ph.reverse_energy.toFixed(1)} kWh` : '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chart Section */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                        {/* Chart Header: Range tabs + Metric selector */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
                                {(['day', 'week', 'month', 'year'] as HistoryRange[]).map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => { setRange(r); setOffset(0); }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${range === r
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
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${chartMetric === m
                                            ? `text-white`
                                            : 'text-white/40 hover:text-white/60'
                                            }`}
                                        style={chartMetric === m ? { backgroundColor: metricColors[m] + '33' } : {}}
                                    >
                                        {m === 'power' ? (range === 'month' || range === 'year' ? 'Energia' : 'Potência') : m === 'voltage' ? 'Tensão' : 'Corrente'}
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
                                    
                                    {showDoubleBars ? (
                                        // Duas barras: Verde para Geração (Solar) e Azul para Consumo (Rede)
                                        <>
                                            <Bar dataKey="generation" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={25} />
                                            <Bar dataKey="consumption" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={25} />
                                        </>
                                    ) : (
                                        // Barra única padrão (Legacy ou Tensão/Corrente)
                                        <Bar dataKey={chartMetric} radius={[6, 6, 0, 0]} maxBarSize={40}>
                                            {chartData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={metricColors[chartMetric]} fillOpacity={0.8} />
                                            ))}
                                        </Bar>
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        )}

                        {/* Legend */}
                        <div className="text-center mt-2 flex justify-center gap-6">
                            {showDoubleBars ? (
                                <>
                                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                        <span className="w-2 h-2 rounded bg-emerald-500" />
                                        Geração Solar
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                                        <span className="w-2 h-2 rounded bg-blue-500" />
                                        Consumo Rede
                                    </div>
                                </>
                            ) : (
                                <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
                                    {metricLabels[chartMetric]} — Média por período
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
