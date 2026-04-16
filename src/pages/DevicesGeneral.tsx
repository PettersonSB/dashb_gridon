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
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative">
                {/* Title */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex flex-shrink-0 items-center justify-center">
                        <Smartphone className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="section-title !mb-0">Dispositivos</h2>
                        <p className="section-subtitle">Monitoramento em tempo real dos seus dispositivos IoT</p>
                    </div>
                </div>

                {/* Inline Stats (Centered) */}
                <div className="flex items-center gap-6 px-6 py-2.5 bg-white/[0.02] border border-white/[0.04] rounded-2xl w-fit xl:absolute xl:left-1/2 xl:-translate-x-1/2">
                    <div className="flex flex-col items-center">
                        <span className="flex items-center gap-1.5 text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                            <Smartphone className="w-3 h-3 text-violet-400" /> Total
                        </span>
                        <span className="text-xl font-display font-bold text-white mt-0.5">{totalDevices}</span>
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
                </div>

                {/* Buttons */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
        <div className="bg-[#1A1D24] border border-white/[0.04] rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 w-full relative overflow-hidden group hover:border-white/10 transition-colors">
            
            {/* Status Indicator Glow */}
            <div
                className={`absolute top-0 left-0 right-0 h-[2px] transition-colors ${
                    isOnline
                        ? isOn
                            ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                            : 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                        : 'bg-red-400/30'
                }`}
            />

            {/* --- LEFT SECTION: Name & Info --- */}
            <div className="flex flex-col flex-1 min-w-0 w-full">
                <h4 className="text-[17px] font-bold text-[#00C2FF] truncate">
                    {device.name || 'Sem nome'}
                </h4>
                <p className="text-[11px] text-[#A0AEC0] mt-0.5 font-mono truncate">
                    {device.device_id}
                </p>
                <div className="w-[80%] h-px bg-white/[0.06] mt-3 mb-2" />
                <span className="text-[12px] text-[#718096] font-medium">
                    Atualizado: {formatUpdatedAt(device.updated_at).replace('Atualizado: ', '')}
                </span>
            </div>

            {/* --- MIDDLE SECTION: Power Box --- */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <div className={`w-[46px] h-[52px] rounded-2xl flex items-center justify-center border-2 ${
                    isOn
                        ? 'border-[#EAB308] bg-[#EAB308]/5'
                        : 'border-[#4A5568] bg-transparent'
                }`}>
                    <Power className={`w-6 h-6 ${isOn ? 'text-[#EAB308]' : 'text-[#4A5568]'}`} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-[28px] font-bold text-white leading-none tracking-tight">
                        {formatPower(device.power)}
                    </span>
                    <span className="text-[11px] text-[#A0AEC0] mt-1 leading-tight">
                        {isOn ? (
                            <>Consumindo<br/>agora</>
                        ) : (
                            <>Desligado<br/>agora</>
                        )}
                    </span>
                </div>
            </div>

            {/* --- RIGHT SECTION: Metrics --- */}
            <div className="flex flex-col items-end shrink-0 w-full md:w-auto mt-2 md:mt-0">
                <div className="bg-[#13151A] rounded-2xl border border-white/[0.03] p-3 flex items-center w-full min-w-[210px]">
                    {/* Tensão */}
                    <div className="flex-1 flex flex-col pl-2 pr-4 relative">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Zap className="w-[14px] h-[14px] text-[#4299E1]" strokeWidth={2.5} />
                            <span className="text-[10px] text-[#A0AEC0] uppercase tracking-widest font-semibold">Tensão</span>
                        </div>
                        <span className="text-lg font-bold text-white leading-none">{formatVoltage(device.voltage)}</span>
                        {/* Vertical Divider */}
                        <div className="absolute right-0 top-1 bottom-1 w-px bg-white/[0.06]" />
                    </div>
                    {/* Corrente */}
                    <div className="flex-1 flex flex-col pl-4 pr-2">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Activity className="w-[14px] h-[14px] text-[#00C2FF]" strokeWidth={2.5} />
                            <span className="text-[10px] text-[#A0AEC0] uppercase tracking-widest font-semibold">Corrente</span>
                        </div>
                        <span className="text-lg font-bold text-white leading-none">{formatCurrent(device.current)}</span>
                    </div>
                </div>

                {/* Bottom Right Dot */}
                <div className="flex items-center gap-2 mt-2 pr-1">
                    <span className="text-[11px] text-[#718096] font-medium">
                        Atualizado: {formatUpdatedAt(device.updated_at).replace('Atualizado: ', '')}
                    </span>
                    <div className={`w-[9px] h-[9px] rounded-full ${isOnline ? 'bg-[#38A169]' : 'bg-[#E53E3E]'}`} />
                </div>
            </div>
        </div>
    );
}
