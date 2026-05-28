import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clientService, ClientAccount, CreateClientPayload } from '@/services/clientService';
import {
    Users, Plus, Search, Eye, Ban, CheckCircle, XCircle,
    Loader2, Smartphone, Mail, Phone, X,
    DollarSign, MapPin, Clock, Upload, Bell
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LocationMap } from '@/components/LocationMap';
import SendNotificationModal from '@/components/SendNotificationModal';

const STATUS_COLORS: Record<string, string> = {
    ativo: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    suspenso: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    desativado: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_LABELS: Record<string, string> = {
    ativo: 'Ativo',
    suspenso: 'Suspenso',
    desativado: 'Desativado',
};

/** Retorna texto relativo como "há 2 dias", "há 5 min" etc. */
function timeAgo(dateStr: string | null): { text: string; color: string } {
    if (!dateStr) return { text: 'Nunca', color: 'text-white/30' };
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    let text: string;
    if (diffMin < 1) text = 'Agora';
    else if (diffMin < 60) text = `há ${diffMin} min`;
    else if (diffHours < 24) text = `há ${diffHours}h`;
    else if (diffDays < 7) text = `há ${diffDays}d`;
    else if (diffDays < 30) text = `há ${Math.floor(diffDays / 7)} sem`;
    else text = `há ${Math.floor(diffDays / 30)} mês${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;

    let color: string;
    if (diffDays <= 3) color = 'text-emerald-400';
    else if (diffDays <= 14) color = 'text-amber-400';
    else color = 'text-red-400/60';

    return { text, color };
}

export default function ClientAccounts() {
    const navigate = useNavigate();
    const location = useLocation();
    const [clients, setClients] = useState<ClientAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversionData, setConversionData] = useState<any>(null);

    useEffect(() => {
        loadClients();
    }, []);

    useEffect(() => {
        const convertData = (location.state as any)?.convertProspect;
        if (convertData) {
            setConversionData(convertData);
            setShowCreateModal(true);
            // Limpa o estado para evitar que reabra ao recarregar a página
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    async function loadClients() {
        try {
            setLoading(true);
            setError(null);
            const data = await clientService.getClients();
            setClients(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    const filtered = clients.filter(c => {
        const q = searchQuery.toLowerCase();
        return (
            c.full_name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.phone && c.phone.includes(q))
        );
    });

    const stats = {
        total: clients.length,
        ativos: clients.filter(c => c.status === 'ativo').length,
        suspensos: clients.filter(c => c.status === 'suspenso').length,
        desativados: clients.filter(c => c.status === 'desativado').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Users className="w-7 h-7 text-amber-500" />
                        App Cliente
                    </h1>
                    <p className="text-white/50 mt-1">Gerencie os acessos dos clientes ao Gridon+</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowNotificationModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.04] border border-white/[0.08] text-white font-medium rounded-xl hover:bg-white/[0.08] hover:border-white/[0.15] transition-all"
                    >
                        <Bell className="w-4 h-4 text-amber-500" />
                        Enviar Notificação
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 whitespace-nowrap"
                    >
                        <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
                        Novo Cliente
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <StatCard icon={Users} label="Total de Clientes" value={stats.total} />
                <StatCard icon={CheckCircle} label="Ativos" value={stats.ativos} />
                <StatCard icon={Ban} label="Suspensos" value={stats.suspensos} />
                <StatCard icon={XCircle} label="Desativados" value={stats.desativados} />
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                    type="text"
                    placeholder="Buscar por nome, email ou telefone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-primary/30 transition-all"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-white/40 hover:text-white ml-4">✕</button>
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-white/40">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Nenhum cliente encontrado</p>
                    <p className="mt-2 text-sm">Clique em "Novo Cliente" para cadastrar o primeiro acesso.</p>
                </div>
            ) : (
                /* Client List */
                <div className="space-y-3">
                    {filtered.map((client) => {
                        const loginInfo = timeAgo(client.last_login_at);
                        return (
                            <div
                                key={client.id}
                                onClick={() => navigate(`/devices/clients/${client.user_id}`)}
                                className="group p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/20 hover:bg-white/[0.04] transition-all cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-lg">
                                            {client.full_name.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Info */}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-white font-semibold group-hover:text-amber-500 transition-colors">
                                                    {client.full_name}
                                                </h3>
                                                {(client as any).prospect_id && (
                                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                        🔗 Convertido de Prospect
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="flex items-center gap-1 text-xs text-white/40">
                                                    <Mail className="w-3 h-3" /> {client.email}
                                                </span>
                                                {client.phone && (
                                                    <span className="flex items-center gap-1 text-xs text-white/40">
                                                        <Phone className="w-3 h-3" /> {client.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Must Change Password */}
                                        {client.must_change_password && (
                                            <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hidden lg:block">
                                                Senha pendente
                                            </span>
                                        )}

                                        {/* Status */}
                                        <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${STATUS_COLORS[client.status]}`}>
                                            {STATUS_LABELS[client.status]}
                                        </span>

                                        {/* Last Login */}
                                        <div className="text-right hidden md:block min-w-[80px]">
                                            <p className="text-[10px] text-white/30 flex items-center gap-1 justify-end">
                                                <Clock className="w-3 h-3" /> Último acesso
                                            </p>
                                            <p className={`text-xs font-medium ${loginInfo.color}`}>{loginInfo.text}</p>
                                        </div>

                                        <Eye className="w-5 h-5 text-white/20 group-hover:text-amber-500 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <CreateClientModal
                    onClose={() => {
                        setShowCreateModal(false);
                        setConversionData(null);
                    }}
                    onCreated={() => {
                        setShowCreateModal(false);
                        setConversionData(null);
                        loadClients();
                    }}
                    conversionData={conversionData}
                />
            )}

            {/* Notification Modal */}
            {showNotificationModal && (
                <SendNotificationModal
                    onClose={() => setShowNotificationModal(false)}
                />
            )}
        </div>
    );
}

// ── Stat Card ───────────────────────────────────────────

function StatCard({ icon: Icon, label, value }: {
    icon: any; label: string; value: number;
}) {
    return (
        <div className="bg-[#13161C]/90 border border-amber-500/15 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 shadow-xl shadow-black/40 hover:border-amber-500/40 hover:bg-[#171A21] hover:shadow-amber-500/[0.04] group">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">{label}</span>
                    <span className="font-display text-3xl font-black mt-2 block tracking-tight bg-gradient-to-br from-amber-400 to-yellow-500 bg-clip-text text-transparent group-hover:from-amber-300 group-hover:to-yellow-400 transition-all duration-300">
                        {value}
                    </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300">
                    <Icon className="w-5 h-5 stroke-[2]" />
                </div>
            </div>
        </div>
    );
}

// ── Modal de Criação de Cliente ─────────────────────────

interface CreateClientModalProps {
    onClose: () => void;
    onCreated: () => void;
    conversionData?: {
        prospect: any;
        selectedBudget: any;
    } | null;
}

function CreateClientModal({ onClose, onCreated, conversionData }: CreateClientModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [allDevices, setAllDevices] = useState<any[]>([]);
    const [loadingDevices, setLoadingDevices] = useState(true);

    // Form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [energyTariff, setEnergyTariff] = useState('0.85');

    // Installation
    const [cep, setCep] = useState('');
    const [address, setAddress] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [powerKwp, setPowerKwp] = useState('');
    const [moduleCount, setModuleCount] = useState('');
    const [modulePowerW, setModulePowerW] = useState('');
    const [moduleModel, setModuleModel] = useState('');
    const [inverterModel, setInverterModel] = useState('');
    const [inverterType, setInverterType] = useState('inversor');
    const [installDate, setInstallDate] = useState('');
    const [notes, setNotes] = useState('');
    const [latitude, setLatitude] = useState<number | undefined>();
    const [longitude, setLongitude] = useState<number | undefined>();
    const [fetchingCep, setFetchingCep] = useState(false);
    
    // Photo upload
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Efeito para pré-preencher dados de prospect se houver conversão
    useEffect(() => {
        if (conversionData) {
            const { prospect, selectedBudget } = conversionData;
            setFullName(prospect.name || '');
            setEmail(prospect.email || '');
            setPhone(prospect.phone || '');

            if (selectedBudget) {
                setCity(selectedBudget.customer_city || prospect.city || '');
                setState(selectedBudget.customer_state || prospect.state || '');
                setNeighborhood(selectedBudget.customer_neighborhood || prospect.neighborhood || '');
                if (selectedBudget.energy_tariff) {
                    setEnergyTariff(String(selectedBudget.energy_tariff));
                }
                if (selectedBudget.kit?.system_power) {
                    setPowerKwp(String(selectedBudget.kit.system_power));
                }
                if (selectedBudget.kit?.equipment_type) {
                    const typeMap: Record<string, string> = {
                        'Inversor': 'inversor',
                        'Micro Inversor': 'micro_inversor',
                        'Inversor Híbrido': 'inversor_hibrido',
                    };
                    setInverterType(typeMap[selectedBudget.kit.equipment_type] || 'inversor');
                }
            } else {
                setCity(prospect.city || '');
                setState(prospect.state || '');
                setNeighborhood(prospect.neighborhood || '');
            }
        }
    }, [conversionData]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    }

    async function handleCepBlur() {
        const rawCep = cep.replace(/\D/g, '');
        if (rawCep.length !== 8) return;

        setFetchingCep(true);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${rawCep}`);
            if (response.ok) {
                const data = await response.json();
                if (data.street) setAddress(data.street);
                if (data.neighborhood) setNeighborhood(data.neighborhood);
                if (data.city) setCity(data.city);
                if (data.state) setState(data.state);
                
                // Attempt geocoding with Nominatim
                const query = `${data.street ? data.street + ',' : ''} ${data.city ? data.city + ',' : ''} ${data.state ? data.state + ',' : ''} Brazil`;
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    if (geoData && geoData.length > 0) {
                        setLatitude(parseFloat(geoData[0].lat));
                        setLongitude(parseFloat(geoData[0].lon));
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao buscar CEP", error);
        } finally {
            setFetchingCep(false);
        }
    }

    // Devices selection
    const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);

    useEffect(() => {
        loadAvailableDevices();
    }, []);

    async function loadAvailableDevices() {
        try {
            setLoadingDevices(true);
            const devices = await clientService.getAvailableDevices();
            setAllDevices(devices);
        } catch {
            // Ignora erro
        } finally {
            setLoadingDevices(false);
        }
    }

    function toggleDevice(deviceId: string) {
        setSelectedDeviceIds(prev =>
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!fullName || !email || !password) return;

        setLoading(true);
        setError(null);

        try {
            let photoUrl = undefined;
            if (photoFile) {
                const ext = photoFile.name.split('.').pop();
                const filename = `installation_${Date.now()}.${ext}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('client-documents')
                    .upload(`installations/${filename}`, photoFile, { upsert: true });

                if (uploadError) {
                    console.error('Erro ao fazer upload da foto:', uploadError);
                    setError(`Erro ao enviar foto: ${uploadError.message}`);
                    setLoading(false);
                    return;
                } else if (uploadData) {
                    const { data: publicUrlData } = supabase.storage
                        .from('client-documents')
                        .getPublicUrl(uploadData.path);
                    photoUrl = publicUrlData.publicUrl;
                }
            }

            const payload: CreateClientPayload = {
                email,
                password,
                full_name: fullName,
                phone: phone || undefined,
                energy_tariff: parseFloat(energyTariff) || 0.85,
                installation: {
                    cep: cep || undefined,
                    address: address || undefined,
                    neighborhood: neighborhood || undefined,
                    city: city || undefined,
                    state: state || undefined,
                    latitude: latitude,
                    longitude: longitude,
                    system_power_kwp: powerKwp ? parseFloat(powerKwp) : undefined,
                    module_count: moduleCount ? parseInt(moduleCount) : undefined,
                    module_power_w: modulePowerW ? parseInt(modulePowerW) : undefined,
                    module_model: moduleModel || undefined,
                    inverter_model: inverterModel || undefined,
                    inverter_type: inverterType || undefined,
                    installation_date: installDate || undefined,
                    installation_photo_url: photoUrl,
                    notes: notes || undefined,
                },
                device_ids: selectedDeviceIds.length > 0 ? selectedDeviceIds : undefined,
                prospect_id: conversionData?.prospect?.id,
                closed_budget_id: conversionData?.selectedBudget?.id,
            };

            await clientService.createClient(payload);
            onCreated();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    const inputClass = "w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all duration-200 text-sm";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-[#13161C] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/80 custom-scrollbar"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-[#13161C] flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Plus className="w-5 h-5 text-amber-500" />
                        Novo Cliente
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {conversionData && (
                    <div className="mx-6 mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                            ⚡ Convertendo Prospect Comercial
                        </p>
                        <p className="text-sm font-bold text-white mt-1">
                            {conversionData.prospect.name}
                        </p>
                        {conversionData.selectedBudget && (
                            <p className="text-xs text-white/50 mt-0.5">
                                Orçamento Base: <span className="text-amber-400 font-medium">{conversionData.selectedBudget.kit?.name || 'Sistema Solar'}</span> — R$ {conversionData.selectedBudget.kit?.kit_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                            </p>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Dados Pessoais */}
                    <div>
                        <h3 className="text-sm font-semibold text-amber-500 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Dados do Cliente
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Nome Completo *</label>
                                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Telefone</label>
                                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Email *</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Senha Provisória *</label>
                                <input type="text" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className={inputClass} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="text-xs text-white/40 block mb-1">Tarifa de Energia (R$/kWh)</label>
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-white/30" />
                                <input type="number" step="0.01" value={energyTariff} onChange={e => setEnergyTariff(e.target.value)}
                                    className="w-32 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-primary/30" />
                            </div>
                        </div>
                    </div>

                    {/* Instalação */}
                    <div>
                        <h3 className="text-sm font-semibold text-amber-500 mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Instalação
                        </h3>
                        <div className="space-y-4">
                            {/* Linha 1: CEP + Endereço */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">
                                        CEP {fetchingCep && <Loader2 className="w-3 h-3 animate-spin inline ml-1" />}
                                    </label>
                                    <input type="text" value={cep} onChange={e => setCep(e.target.value)} onBlur={handleCepBlur} placeholder="00000-000" className={inputClass} />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-white/40 block mb-1">Endereço</label>
                                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={inputClass} />
                                </div>
                            </div>
                            {/* Linha 2: Bairro + Cidade + Estado */}
                            <div className="grid grid-cols-6 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs text-white/40 block mb-1">Bairro</label>
                                    <input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className={inputClass} />
                                </div>
                                <div className="col-span-3">
                                    <label className="text-xs text-white/40 block mb-1">Cidade</label>
                                    <input type="text" value={city} onChange={e => setCity(e.target.value)} className={inputClass} />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-xs text-white/40 block mb-1">UF</label>
                                    <input type="text" value={state} onChange={e => setState(e.target.value)} maxLength={2}
                                        className={inputClass + ' uppercase text-center'} />
                                </div>
                            </div>
                            {/* Linha 3: Potência + Módulos (Qnt + W) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">Potência (kWp)</label>
                                    <input type="number" step="0.1" value={powerKwp} onChange={e => setPowerKwp(e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">Módulos</label>
                                    <div className="flex gap-2">
                                        <div className="relative" style={{ width: '110px' }}>
                                            <input type="number" value={moduleCount} onChange={e => setModuleCount(e.target.value)} className={inputClass + ' text-center pr-10'} />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/30 pointer-events-none font-medium">Qnt</span>
                                        </div>
                                        <div className="relative flex-1">
                                            <input type="number" value={modulePowerW} onChange={e => setModulePowerW(e.target.value)} placeholder="600" className={inputClass + ' text-center pr-8'} />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 pointer-events-none font-medium">W</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Linha 4: Modelo Módulo + Modelo Inversor */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">Modelo Módulo</label>
                                    <input type="text" value={moduleModel} onChange={e => setModuleModel(e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">Modelo Inversor</label>
                                    <input type="text" value={inverterModel} onChange={e => setInverterModel(e.target.value)} className={inputClass} />
                                </div>
                            </div>
                            {/* Linha 5: Tipo Inversor + Data Instalação */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">Tipo de Inversor</label>
                                    <select value={inverterType} onChange={e => setInverterType(e.target.value)} className={inputClass + ' appearance-none'}>
                                        <option value="inversor">Inversor</option>
                                        <option value="micro_inversor">Micro Inversor</option>
                                        <option value="inversor_hibrido">Inversor Híbrido</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">Data Instalação</label>
                                    <input type="date" value={installDate} onChange={e => setInstallDate(e.target.value)} className={inputClass} />
                                </div>
                            </div>
                            {/* Linha 6: Foto da Instalação */}
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Foto da Instalação</label>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-full h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                                        photoPreview ? 'border-primary/50 bg-primary/5 overflow-hidden p-1' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'
                                    }`}
                                >
                                    <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <>
                                            <Upload className="w-6 h-6 text-white/40 mb-2" />
                                            <span className="text-sm text-white/60">Clique para enviar a foto</span>
                                            <span className="text-xs text-white/30 mt-1">JPG, PNG, WEBP</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 border-t border-white/[0.06] pt-4">
                            <h4 className="text-xs font-semibold text-white/60 mb-3">Localização (Mapa)</h4>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">Latitude</label>
                                    <input type="number" step="any" value={latitude ?? ''} onChange={e => setLatitude(e.target.value ? parseFloat(e.target.value) : undefined)} className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">Longitude</label>
                                    <input type="number" step="any" value={longitude ?? ''} onChange={e => setLongitude(e.target.value ? parseFloat(e.target.value) : undefined)} className={inputClass} />
                                </div>
                            </div>
                            <p className="text-[10px] text-white/40 mb-2">
                                Dica: Clique no mapa para atualizar a localização exata do cliente. O mapa é centralizado automaticamente ao buscar o CEP.
                            </p>
                            <LocationMap 
                                lat={latitude} 
                                lng={longitude} 
                                editable={true} 
                                onChange={(lat, lng) => {
                                    setLatitude(lat);
                                    setLongitude(lng);
                                }} 
                            />
                        </div>
                    </div>

                    {/* Dispositivos */}
                    <div>
                        <h3 className="text-sm font-semibold text-amber-500 mb-3 flex items-center gap-2">
                            <Smartphone className="w-4 h-4" /> Vincular Dispositivos
                        </h3>
                        {loadingDevices ? (
                            <div className="flex items-center gap-2 text-white/30 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" /> Carregando dispositivos...
                            </div>
                        ) : allDevices.length === 0 ? (
                            <p className="text-sm text-white/30">Nenhum dispositivo disponível (todos já estão vinculados).</p>
                        ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {allDevices.map((device: any) => (
                                    <label
                                        key={device.device_id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedDeviceIds.includes(device.device_id)
                                                ? 'bg-primary/10 border-primary/30'
                                                : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedDeviceIds.includes(device.device_id)}
                                            onChange={() => toggleDevice(device.device_id)}
                                            className="accent-primary"
                                        />
                                        <div>
                                            <p className="text-sm text-white font-medium">{device.name}</p>
                                            <p className="text-xs text-white/30">{device.device_id}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10 mt-6">
                        <button type="button" onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading || !fullName || !email || !password}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/10 text-sm"
                        >
                            {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Plus className="w-4.5 h-4.5 stroke-[2.5]" />}
                            Criar Cliente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
