import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deviceService } from '@/services/deviceService';
import { Device } from '@/lib/types';
import { emitToast } from '@/components/ui/Toaster';
import DeviceDetailModal from '@/components/DeviceDetailModal';
import {
    Smartphone,
    Zap,
    Activity,
    Gauge,
    Power,
    RefreshCw,
    Wifi,
    WifiOff,
    Loader2,
    Search,
    LayoutGrid,
    List,
    Timer,
    ChevronDown,
    Sun,
} from 'lucide-react';

const REFRESH_OPTIONS = [
    { label: '1 min', value: 60, cron: '*/1 * * * *' },
    { label: '2 min', value: 120, cron: '*/2 * * * *' },
    { label: '5 min', value: 300, cron: '*/5 * * * *' },
    { label: '10 min', value: 600, cron: '*/10 * * * *' },
];

const STORAGE_KEY_INTERVAL = 'gridon_device_refresh_interval';

function loadInterval(): number {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_INTERVAL);
        if (saved) return parseInt(saved, 10);
    } catch { /* ignore */ }
    return 300; // 5 min default
}

export default function DevicesGeneral() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    // Server-aware timer state
    const [intervalSeconds, setIntervalSeconds] = useState(loadInterval);
    const [countdown, setCountdown] = useState(loadInterval());
    const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const {
        data: devices = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['devices'],
        queryFn: () => deviceService.getDevices(),
        refetchInterval: 30000, // relê o banco a cada 30s para pegar novos dados do cron
    });

    // Calcula o countdown baseado no updated_at mais recente dos devices
    // Roda sempre que os devices são carregados/atualizados
    const latestUpdateRef = useRef(0);

    useEffect(() => {
        if (devices.length > 0) {
            const latestUpdate = devices.reduce((latest, d) => {
                const t = new Date(d.updated_at).getTime();
                return t > latest ? t : latest;
            }, 0);

            // Só recalcula se a data de atualização realmente mudou
            if (latestUpdate !== latestUpdateRef.current) {
                latestUpdateRef.current = latestUpdate;
                const elapsed = Math.floor((Date.now() - latestUpdate) / 1000);
                const remaining = Math.max(1, intervalSeconds - elapsed);
                setCountdown(remaining);
            }
        }
    }, [devices, intervalSeconds]);

    // Tick do countdown — roda independente, 1x por segundo
    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    refetch();
                    return intervalSeconds;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [intervalSeconds]);

    const changeInterval = async (seconds: number) => {
        const option = REFRESH_OPTIONS.find(o => o.value === seconds);
        setIntervalSeconds(seconds);
        setCountdown(seconds);
        localStorage.setItem(STORAGE_KEY_INTERVAL, String(seconds));
        setShowIntervalDropdown(false);

        // Atualizar o cron no servidor
        if (option) {
            try {
                await deviceService.updateRefreshInterval(option.cron);
                emitToast({ title: 'Intervalo atualizado', description: `Coleta automática agora a cada ${option.label}.` });
            } catch (e) {
                console.error('Erro ao atualizar cron:', e);
                emitToast({ title: 'Aviso', description: 'Intervalo salvo localmente. O cron do servidor pode precisar de ajuste manual.', variant: 'destructive' });
            }
        }
    };

    const formatCountdown = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    // Sincronizar dispositivos com a Tuya + buscar dados elétricos
    const handleSync = async () => {
        setIsSyncing(true);
        try {
            // 1. Sincronizar lista de dispositivos
            await deviceService.syncDevices();
            await refetch();

            // 2. Buscar dados elétricos em tempo real de cada dispositivo
            await deviceService.refreshAllDevicesData();
            await refetch();

            emitToast({
                title: 'Sincronizado!',
                description: 'Dispositivos e dados elétricos atualizados.',
            });
        } catch (err) {
            console.error(err);
            emitToast({
                title: 'Erro na sincronização',
                description: 'Não foi possível sincronizar com a Tuya.',
                variant: 'destructive',
            });
        } finally {
            setIsSyncing(false);
        }
    };

    // Atualizar apenas os dados elétricos (sem re-sincronizar a lista)
    const handleRefreshData = async () => {
        setIsRefreshing(true);
        try {
            await deviceService.refreshAllDevicesData();
            await refetch();
            emitToast({
                title: 'Dados atualizados!',
                description: 'Leituras elétricas atualizadas em tempo real.',
            });
        } catch (err) {
            console.error(err);
            emitToast({
                title: 'Erro',
                description: 'Não foi possível atualizar os dados.',
                variant: 'destructive',
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    // Filtro + busca
    const filtered = devices.filter((d) => {
        const matchesSearch =
            !searchTerm ||
            (d.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.device_id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            filterStatus === 'all' ||
            (filterStatus === 'online' && d.online === 'true') ||
            (filterStatus === 'offline' && d.online !== 'true');

        return matchesSearch && matchesFilter;
    });

    // Estatísticas rápidas
    const totalDevices = devices.length;
    const onlineCount = devices.filter((d) => d.online === 'true').length;
    const offlineCount = totalDevices - onlineCount;

    // Check if device is actually active/on (online and measuring/explicitly on)
    const isDeviceOn = (d: Device) => {
        const isOnline = d.online === 'true';
        if (!isOnline) return false;
        const phases = d.telemetry_data?.phases;
        const hasMultiphase = !!phases && Object.keys(phases).length > 0;
        return d.is_on === true || hasMultiphase || (d.power != null && Math.abs(d.power) > 2);
    };

    const offCount = devices.filter((d) => d.online === 'true' && !isDeviceOn(d)).length;
    const totalPower = devices.reduce((sum, d) => sum + (d.power ?? 0), 0);

    const formatPower = (w: number | null) => {
        if (w == null) return '—';
        return w >= 1000 ? `${(w / 1000).toFixed(1)} kW` : `${w.toFixed(0)} W`;
    };

    const formatVoltage = (v: number | null) => {
        if (v == null) return '—';
        return `${v.toFixed(1)} V`;
    };

    const formatCurrent = (c: number | null) => {
        if (c == null) return '—';
        return `${c.toFixed(2)} A`;
    };

    const formatUpdatedAt = (dt: string) => {
        if (!dt) return '—';
        
        // Agora que o backend (Edge Function) salva exatamente no horário de Brasília,
        // garantimos que o JS entenda como horário de Brasília ao manter sem Z e parsear
        const dtStr = dt.includes('.') ? dt.split('.')[0] : dt; // Limpa milissegundos
        let isoStr = dtStr;
        
        // Se a string veio com Z, remover pois o horário já é o correto do Brasil
        if (isoStr.endsWith('Z')) {
            isoStr = isoStr.slice(0, -1);
        }
        
        const date = new Date(isoStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        
        // Se a data estiver no futuro (possível descompasso de relógio entre DB e Cliente), arredondamos para "Agora"
        if (diffMs < 0) return 'Agora';

        const diffMin = Math.floor(diffMs / 60000);

        if (diffMin < 1) return 'Agora';
        if (diffMin < 60) return `${diffMin}min atrás`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `${diffHours}h atrás`;
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative">
                {/* Title */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-shrink-0 items-center justify-center">
                        <Smartphone className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="section-title !mb-0">Dispositivos</h2>
                        <p className="section-subtitle">Monitoramento em tempo real dos seus dispositivos IoT</p>
                    </div>
                </div>

                {/* Inline Stats (Centered) */}
                <div className="flex items-center gap-6 px-6 py-2.5 bg-[#13161C]/90 border border-amber-500/15 rounded-2xl w-fit xl:absolute xl:left-1/2 xl:-translate-x-1/2 shadow-xl shadow-black/40 hover:border-amber-500/30 transition-all duration-300">
                    <div className="flex flex-col items-center">
                        <span className="flex items-center gap-1.5 text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                            <Smartphone className="w-3 h-3 text-amber-500" /> Total
                        </span>
                        <span className="text-xl font-display font-bold bg-gradient-to-br from-amber-400 to-yellow-500 bg-clip-text text-transparent mt-0.5">{totalDevices}</span>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div className="flex flex-col items-center">
                        <span className="flex items-center gap-1.5 text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                            <Wifi className="w-3 h-3 text-emerald-400" /> Online
                        </span>
                        <span className="text-xl font-display font-bold text-emerald-400 mt-0.5">{onlineCount}</span>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div className="flex flex-col items-center">
                        <span className="flex items-center gap-1.5 text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                            <WifiOff className="w-3 h-3 text-red-400" /> Offline
                        </span>
                        <span className="text-xl font-display font-bold text-red-400 mt-0.5">{offlineCount}</span>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div className="flex flex-col items-center">
                        <span className="flex items-center gap-1.5 text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                            <Power className="w-3 h-3 text-slate-400" /> OFF
                        </span>
                        <span className="text-xl font-display font-bold text-slate-400 mt-0.5">{offCount}</span>
                    </div>
                </div>

                {/* Buttons + Timer */}
                <div className="flex items-center gap-2">
                    {/* Countdown Timer */}
                    <div className="relative">
                        <button
                            onClick={() => setShowIntervalDropdown(!showIntervalDropdown)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
                        >
                            <Timer className="w-4 h-4 text-amber-500" />
                            <span className="text-white/70 font-mono tabular-nums min-w-[36px] text-center">
                                {formatCountdown(countdown)}
                            </span>
                            <ChevronDown className="w-3 h-3 text-white/30" />
                        </button>

                        {showIntervalDropdown && (
                            <div className="absolute right-0 top-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-xl py-1 z-50 min-w-[140px] animate-fade-in">
                                {REFRESH_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => changeInterval(opt.value)}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors ${
                                            intervalSeconds === opt.value ? 'text-amber-500 font-semibold' : 'text-white/60'
                                        }`}
                                    >
                                        {opt.label}
                                        {opt.value === 300 && <span className="text-[10px] text-white/30 ml-2">(padrão)</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {devices.length > 0 && (
                        <button
                            onClick={handleRefreshData}
                            disabled={isRefreshing || isSyncing}
                            className="btn-ghost flex items-center gap-2 text-sm !border !border-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Activity className={`w-4 h-4 ${isRefreshing ? 'animate-pulse' : ''}`} />
                            {isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}
                        </button>
                    )}
                    <button
                        onClick={handleSync}
                        disabled={isSyncing || isRefreshing}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar Tuya'}
                    </button>
                </div>
            </div>

            {/* Toolbar: Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou ID..."
                        className="form-input !pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'online', 'offline'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                filterStatus === status
                                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                                    : 'bg-white/[0.04] text-white/50 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/70'
                            }`}
                        >
                            {status === 'all' ? 'Todos' : status === 'online' ? 'Online' : 'Offline'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Device Table List */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <Smartphone className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-lg font-display font-semibold text-white/60 mb-2">
                        {devices.length === 0 ? 'Nenhum dispositivo encontrado' : 'Nenhum resultado para o filtro'}
                    </h3>
                    <p className="text-sm text-white/30 max-w-md mx-auto">
                        {devices.length === 0
                            ? 'Clique em "Sincronizar Tuya" para buscar seus dispositivos na plataforma.'
                            : 'Tente ajustar o termo de busca ou os filtros.'}
                    </p>
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/[0.01]">
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">Dispositivo</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">Potência Atual</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">Leituras (V / A)</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">Fases (TCs)</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">Última Atualização</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map((device) => {
                                    const isOnline = device.online === 'true';
                                    const phases = device.telemetry_data?.phases;
                                    const phaseConfig = device.phase_config;

                                    let genPower = 0;
                                    let conPower = 0;
                                    let hasMultiphase = false;

                                    if (phases) {
                                        const phaseKeys = Object.keys(phases);
                                        if (phaseKeys.length > 0) {
                                            hasMultiphase = true;
                                            phaseKeys.forEach((pKey) => {
                                                const phase = (phases as any)[pKey];
                                                if (phase) {
                                                    const role = phaseConfig?.[pKey as keyof typeof phaseConfig] ?? 
                                                        (pKey === 'a' ? 'generation' : pKey === 'b' ? 'consumption' : 'none');
                                                    
                                                    const p = phase.power ?? 0;
                                                    if (role === 'generation') {
                                                        genPower += Math.abs(p);
                                                    } else if (role === 'consumption') {
                                                        conPower += Math.abs(p);
                                                    }
                                                }
                                            });
                                        }
                                    }

                                    const isOn = isOnline && (
                                        device.is_on === true ||
                                        hasMultiphase ||
                                        (device.power != null && Math.abs(device.power) > 2)
                                    );

                                    return (
                                        <tr 
                                            key={device.id}
                                            onClick={() => setSelectedDevice(device)}
                                            className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                        >
                                            {/* Dispositivo */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <div className="font-semibold text-amber-500 group-hover:text-amber-400 transition-colors">
                                                            {device.name || 'Sem nome'}
                                                        </div>
                                                        <div className="text-[10px] text-white/30 font-mono mt-0.5">
                                                            {device.device_id}
                                                        </div>
                                                    </div>
                                                    {hasMultiphase && (
                                                        <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                            Multi-fase
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {!isOnline ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                        Offline
                                                    </span>
                                                ) : isOn ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                                                        Ligado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                        Desligado
                                                    </span>
                                                )}
                                            </td>

                                            {/* Potência Atual */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {hasMultiphase ? (
                                                    <div className="flex flex-col gap-0.5 text-xs font-mono">
                                                        <span className="text-emerald-400 font-bold">Geração: {formatPower(genPower)}</span>
                                                        <span className="text-blue-400 font-bold">Consumo: {formatPower(conPower)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="font-display text-base font-bold bg-gradient-to-br from-amber-400 to-yellow-500 bg-clip-text text-transparent group-hover:from-amber-300 group-hover:to-yellow-400 transition-all duration-300">
                                                        {isOnline ? formatPower(device.power) : '—'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Leituras (V / A) */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white/60">
                                                {hasMultiphase ? (
                                                    <span className="text-white/30 text-[11px]">Múltiplas leituras</span>
                                                ) : isOnline ? (
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <span>{formatVoltage(device.voltage)}</span>
                                                        <span className="text-white/20">|</span>
                                                        <span>{formatCurrent(device.current)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-white/20">—</span>
                                                )}
                                            </td>

                                            {/* Fases (TCs) */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {hasMultiphase && phases ? (
                                                    <div className="flex flex-col gap-1 max-w-[280px]">
                                                        {Object.entries(phases).map(([key, ph]: any) => {
                                                            const role = phaseConfig?.[key as keyof typeof phaseConfig] ?? 
                                                                (key === 'a' ? 'generation' : key === 'b' ? 'consumption' : 'none');
                                                            const badgeColor = role === 'generation' 
                                                                ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
                                                                : role === 'consumption' 
                                                                ? 'border-blue-500/20 bg-blue-500/5 text-blue-400' 
                                                                : 'border-white/[0.04] text-white/30 bg-transparent';
                                                            
                                                            return (
                                                                <div key={key} className={`inline-flex items-center justify-between text-[10px] font-mono border rounded-lg px-2 py-0.5 ${badgeColor}`}>
                                                                    <span className="uppercase font-bold mr-2">TC {key.toUpperCase()}</span>
                                                                    <div className="flex gap-1.5">
                                                                        <span>{ph.voltage != null ? `${ph.voltage.toFixed(0)}V` : '—'}</span>
                                                                        <span className="opacity-30">|</span>
                                                                        <span>{ph.current != null ? `${ph.current.toFixed(1)}A` : '—'}</span>
                                                                        <span className="opacity-30">|</span>
                                                                        <span className="font-semibold">{ph.power != null ? `${Math.abs(ph.power).toFixed(0)}W` : '—'}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-white/20 text-xs">—</span>
                                                )}
                                            </td>

                                            {/* Última Atualização */}
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-white/50">
                                                <div className="flex items-center gap-2 justify-between">
                                                    <span>{formatUpdatedAt(device.updated_at)}</span>
                                                    <ChevronDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -rotate-90 text-amber-500 transition-all duration-300" />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Device Detail Modal */}
            {selectedDevice && (
                <DeviceDetailModal
                    device={selectedDevice}
                    onClose={() => setSelectedDevice(null)}
                />
            )}
        </div>
    );
}
