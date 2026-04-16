import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deviceService } from '@/services/deviceService';
import { Device } from '@/lib/types';
import { emitToast } from '@/components/ui/Toaster';
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
} from 'lucide-react';

export default function DevicesGeneral() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const {
        data: devices = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['devices'],
        queryFn: () => deviceService.getDevices(),
        refetchInterval: 30000, // auto-refresh a cada 30s
    });

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
        const date = new Date(dt);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="section-title !mb-0">Dispositivos</h2>
                        <p className="section-subtitle">Monitoramento em tempo real dos seus dispositivos IoT</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
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
                        className="glow-btn flex items-center gap-2 text-sm !px-5 !py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar Tuya'}
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card-stat">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/40">Total</span>
                        <Smartphone className="w-5 h-5 text-violet-400" />
                    </div>
                    <span className="font-display text-3xl font-bold text-white">{totalDevices}</span>
                </div>
                <div className="card-stat">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/40">Online</span>
                        <Wifi className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="font-display text-3xl font-bold text-emerald-400">{onlineCount}</span>
                </div>
                <div className="card-stat">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/40">Offline</span>
                        <WifiOff className="w-5 h-5 text-red-400" />
                    </div>
                    <span className="font-display text-3xl font-bold text-red-400">{offlineCount}</span>
                </div>
                <div className="card-stat">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/40">Potência Total</span>
                        <Zap className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="font-display text-3xl font-bold text-amber-400">{formatPower(totalPower)}</span>
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
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'bg-white/[0.04] text-white/50 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/70'
                            }`}
                        >
                            {status === 'all' ? 'Todos' : status === 'online' ? 'Online' : 'Offline'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Device Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((device) => (
                        <DeviceCard
                            key={device.id}
                            device={device}
                            formatPower={formatPower}
                            formatVoltage={formatVoltage}
                            formatCurrent={formatCurrent}
                            formatUpdatedAt={formatUpdatedAt}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ——————————— Device Card Component ——————————— */

function DeviceCard({
    device,
    formatPower,
    formatVoltage,
    formatCurrent,
    formatUpdatedAt,
}: {
    device: Device;
    formatPower: (w: number | null) => string;
    formatVoltage: (v: number | null) => string;
    formatCurrent: (c: number | null) => string;
    formatUpdatedAt: (dt: string) => string;
}) {
    const isOnline = device.online === 'true';
    const isOn = device.is_on === true;

    return (
        <div className="glass-card-hover group relative overflow-hidden">
            {/* Status Indicator Light – top border glow */}
            <div
                className={`absolute top-0 left-0 right-0 h-[2px] transition-colors ${
                    isOnline
                        ? isOn
                            ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                            : 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                        : 'bg-red-400/50'
                }`}
            />

            <div className="p-5">
                {/* Top: Name + Status */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
                            {device.name || 'Sem nome'}
                        </h4>
                        <p className="text-[11px] text-white/25 mt-0.5 font-mono truncate">
                            {device.device_id}
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                        {/* Online badge */}
                        <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide ${
                                isOnline
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                            {isOnline ? 'ON' : 'OFF'}
                        </span>
                    </div>
                </div>

                {/* Power Status – Large Display */}
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isOn
                            ? 'bg-amber-500/10 border border-amber-500/20'
                            : 'bg-white/[0.04] border border-white/[0.06]'
                    }`}>
                        <Power className={`w-5 h-5 ${isOn ? 'text-amber-400' : 'text-white/20'}`} />
                    </div>
                    <div>
                        <span className="text-2xl font-display font-bold text-white">
                            {formatPower(device.power)}
                        </span>
                        <p className="text-[11px] text-white/30 -mt-0.5">
                            {isOn ? 'Consumindo agora' : 'Desligado'}
                        </p>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Zap className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px] text-white/40 uppercase tracking-wide">Tensão</span>
                        </div>
                        <span className="text-sm font-semibold text-white/80">{formatVoltage(device.voltage)}</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Activity className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px] text-white/40 uppercase tracking-wide">Corrente</span>
                        </div>
                        <span className="text-sm font-semibold text-white/80">{formatCurrent(device.current)}</span>
                    </div>
                </div>

                {/* Footer: Updated at */}
                <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                    <span className="text-[11px] text-white/20">
                        Atualizado: {formatUpdatedAt(device.updated_at)}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                        isOnline ? 'bg-emerald-400/60' : 'bg-white/10'
                    }`} />
                </div>
            </div>
        </div>
    );
}
