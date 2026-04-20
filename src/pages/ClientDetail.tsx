import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService, ClientAccount, ClientInstallation, EnergyBill, SupportTicket } from '@/services/clientService';
import {
    ArrowLeft, User, Mail, Phone, DollarSign, Calendar, Clock,
    Shield, CheckCircle, Ban, XCircle, Trash2, KeyRound,
    Smartphone, Plus, Unlink, Upload, FileText, Download,
    MessageSquare, Send, Loader2, MapPin, Zap, Package
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
    ativo: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    suspenso: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    desativado: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function ClientDetail() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState<ClientAccount | null>(null);
    const [installation, setInstallation] = useState<ClientInstallation | null>(null);
    const [devices, setDevices] = useState<any[]>([]);
    const [bills, setBills] = useState<EnergyBill[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'devices' | 'bills' | 'tickets'>('info');
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (userId) loadAll();
    }, [userId]);

    async function loadAll() {
        if (!userId) return;
        setLoading(true);
        try {
            const [clientData, installData, devData, billsData, ticketsData] = await Promise.all([
                clientService.getClient(userId),
                clientService.getInstallation(userId),
                clientService.getClientDevices(userId),
                clientService.getBills(userId),
                clientService.getTickets(userId),
            ]);
            setClient(clientData);
            setInstallation(installData);
            setDevices(devData);
            setBills(billsData);
            setTickets(ticketsData);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleAction(action: 'suspend' | 'activate' | 'deactivate' | 'delete') {
        if (!userId) return;
        const confirmMsg: Record<string, string> = {
            suspend: 'Tem certeza que deseja SUSPENDER este cliente?',
            activate: 'Tem certeza que deseja REATIVAR este cliente?',
            deactivate: 'Tem certeza que deseja DESATIVAR permanentemente este cliente?',
            delete: 'ATENÇÃO: Isso irá DELETAR o cliente e TODOS os seus dados. Esta ação é irreversível!',
        };
        if (!confirm(confirmMsg[action])) return;

        setActionLoading(true);
        try {
            const result = await clientService.manageClient(action, userId);
            setSuccess(result.message);
            if (action === 'delete') {
                navigate('/devices/clients');
            } else {
                await loadAll();
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setActionLoading(false);
        }
    }

    async function handleResetPassword() {
        const newPassword = prompt('Digite a nova senha provisória (mínimo 6 caracteres):');
        if (!newPassword || newPassword.length < 6) return;
        if (!userId) return;

        setActionLoading(true);
        try {
            const result = await clientService.manageClient('reset_password', userId, newPassword);
            setSuccess(result.message);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setActionLoading(false);
        }
    }

    function formatDate(dateStr: string | null): string {
        if (!dateStr) return '—';
        try {
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }).format(new Date(dateStr));
        } catch {
            return dateStr;
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="text-center py-32 text-white/40">
                <p>Cliente não encontrado</p>
                <button onClick={() => navigate('/devices/clients')} className="mt-4 text-primary hover:underline">
                    ← Voltar
                </button>
            </div>
        );
    }

    const tabs = [
        { key: 'info' as const, label: 'Informações', icon: User },
        { key: 'devices' as const, label: `Dispositivos (${devices.length})`, icon: Smartphone },
        { key: 'bills' as const, label: `Contas (${bills.length})`, icon: FileText },
        { key: 'tickets' as const, label: `Chamados (${tickets.length})`, icon: MessageSquare },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/devices/clients')} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">{client.full_name}</h1>
                    <p className="text-white/40 text-sm">{client.email}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${STATUS_COLORS[client.status]}`}>
                    {client.status.toUpperCase()}
                </span>
            </div>

            {/* Alerts */}
            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
                    {error}
                    <button onClick={() => setError(null)} className="text-white/40 hover:text-white">✕</button>
                </div>
            )}
            {success && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between">
                    {success}
                    <button onClick={() => setSuccess(null)} className="text-white/40 hover:text-white">✕</button>
                </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
                {client.status === 'ativo' && (
                    <button onClick={() => handleAction('suspend')} disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/20 transition-all disabled:opacity-50">
                        <Ban className="w-4 h-4" /> Suspender
                    </button>
                )}
                {client.status === 'suspenso' && (
                    <button onClick={() => handleAction('activate')} disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                        <CheckCircle className="w-4 h-4" /> Reativar
                    </button>
                )}
                <button onClick={handleResetPassword} disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/20 transition-all disabled:opacity-50">
                    <KeyRound className="w-4 h-4" /> Resetar Senha
                </button>
                <button onClick={() => handleAction('deactivate')} disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-all disabled:opacity-50">
                    <XCircle className="w-4 h-4" /> Desativar
                </button>
                <button onClick={() => handleAction('delete')} disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/5 border border-red-500/10 text-red-400/60 text-sm hover:bg-red-500/15 transition-all disabled:opacity-50">
                    <Trash2 className="w-4 h-4" /> Deletar
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.key
                                ? 'bg-primary/15 text-primary'
                                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden md:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'info' && <InfoTab client={client} installation={installation} formatDate={formatDate} />}
            {activeTab === 'devices' && <DevicesTab devices={devices} clientUserId={userId!} onReload={loadAll} />}
            {activeTab === 'bills' && <BillsTab bills={bills} clientUserId={userId!} onReload={loadAll} formatDate={formatDate} />}
            {activeTab === 'tickets' && <TicketsTab tickets={tickets} onReload={loadAll} formatDate={formatDate} />}
        </div>
    );
}

// ── Tab: Info ──────────────────────────────────────────

function InfoTab({ client, installation, formatDate }: { client: ClientAccount; installation: ClientInstallation | null; formatDate: (s: string | null) => string }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dados da Conta */}
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><User className="w-4 h-4" /> Conta</h3>
                <InfoRow label="Nome" value={client.full_name} />
                <InfoRow label="Email" value={client.email} />
                <InfoRow label="Telefone" value={client.phone || '—'} />
                <InfoRow label="Tarifa" value={`R$ ${client.energy_tariff}/kWh`} />
                <InfoRow label="Troca Senha" value={client.must_change_password ? '⚠️ Pendente' : '✅ Já trocou'} />
                <InfoRow label="Último Login" value={formatDate(client.last_login_at)} />
                <InfoRow label="Criado em" value={formatDate(client.created_at)} />
            </div>

            {/* Instalação */}
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><MapPin className="w-4 h-4" /> Instalação</h3>
                {installation ? (
                    <>
                        <InfoRow label="Endereço" value={[installation.address, installation.city, installation.state].filter(Boolean).join(', ') || '—'} />
                        <InfoRow label="Potência" value={installation.system_power_kwp ? `${installation.system_power_kwp} kWp` : '—'} />
                        <InfoRow label="Módulos" value={installation.module_count ? `${installation.module_count}` : '—'} />
                        <InfoRow label="Modelo Módulo" value={installation.module_model || '—'} />
                        <InfoRow label="Inversor" value={installation.inverter_model || '—'} />
                        <InfoRow label="Instalado em" value={installation.installation_date || '—'} />
                    </>
                ) : (
                    <p className="text-sm text-white/30">Nenhuma instalação cadastrada</p>
                )}
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-xs text-white/40">{label}</span>
            <span className="text-sm text-white/70">{value}</span>
        </div>
    );
}

// ── Tab: Devices ──────────────────────────────────────

function DevicesTab({ devices, clientUserId, onReload }: { devices: any[]; clientUserId: string; onReload: () => void }) {
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [availableDevices, setAvailableDevices] = useState<any[]>([]);
    const [loadingAvailable, setLoadingAvailable] = useState(false);

    async function loadAvailable() {
        setLoadingAvailable(true);
        try {
            const data = await clientService.getAvailableDevices();
            setAvailableDevices(data);
        } catch { }
        setLoadingAvailable(false);
        setShowLinkModal(true);
    }

    async function handleLink(deviceId: string) {
        try {
            await clientService.linkDevice(deviceId, clientUserId);
            setShowLinkModal(false);
            onReload();
        } catch { }
    }

    async function handleUnlink(deviceId: string) {
        if (!confirm('Desvincular este dispositivo do cliente?')) return;
        try {
            await clientService.unlinkDevice(deviceId);
            onReload();
        } catch { }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Dispositivos Vinculados</h3>
                <button onClick={loadAvailable}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg text-sm hover:bg-primary/20 transition-all">
                    <Plus className="w-4 h-4" /> Vincular
                </button>
            </div>

            {devices.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-8">Nenhum dispositivo vinculado</p>
            ) : (
                <div className="space-y-2">
                    {devices.map((device: any) => (
                        <div key={device.device_id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${device.online === 'true' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                <div>
                                    <p className="text-sm text-white font-medium">{device.name}</p>
                                    <p className="text-xs text-white/30">{device.device_id}</p>
                                </div>
                            </div>
                            <button onClick={() => handleUnlink(device.device_id)}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
                                <Unlink className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={() => setShowLinkModal(false)}>
                    <div onClick={e => e.stopPropagation()} className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-white mb-4">Vincular Dispositivo</h3>
                        {loadingAvailable ? (
                            <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                        ) : availableDevices.length === 0 ? (
                            <p className="text-sm text-white/30 text-center py-4">Nenhum dispositivo disponível</p>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {availableDevices.map((d: any) => (
                                    <button key={d.device_id} onClick={() => handleLink(d.device_id)}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-primary/30 text-left transition-all">
                                        <Smartphone className="w-4 h-4 text-white/30" />
                                        <div>
                                            <p className="text-sm text-white">{d.name}</p>
                                            <p className="text-xs text-white/30">{d.device_id}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setShowLinkModal(false)} className="w-full mt-4 py-2 text-center text-white/40 hover:text-white text-sm">
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Tab: Bills ────────────────────────────────────────

function BillsTab({ bills, clientUserId, onReload, formatDate }: { bills: EnergyBill[]; clientUserId: string; onReload: () => void; formatDate: (s: string | null) => string }) {
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [refMonth, setRefMonth] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [totalValue, setTotalValue] = useState('');
    const [injected, setInjected] = useState('');
    const [consumption, setConsumption] = useState('');
    const [savings, setSavings] = useState('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault();
        if (!refMonth) return;

        setUploading(true);
        try {
            let pdfUrl: string | undefined;
            if (pdfFile) {
                pdfUrl = await clientService.uploadBillPdf(clientUserId, refMonth, pdfFile);
            }

            await clientService.upsertBill({
                client_user_id: clientUserId,
                reference_month: refMonth,
                due_date: dueDate || null,
                total_value: totalValue ? parseFloat(totalValue) : null,
                injected_credits_kwh: injected ? parseFloat(injected) : null,
                grid_consumption_kwh: consumption ? parseFloat(consumption) : null,
                savings: savings ? parseFloat(savings) : null,
                pdf_url: pdfUrl || null,
            });

            setShowUpload(false);
            setRefMonth(''); setDueDate(''); setTotalValue(''); setInjected(''); setConsumption(''); setSavings(''); setPdfFile(null);
            onReload();
        } catch (e: any) {
            alert('Erro: ' + e.message);
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Contas de Energia</h3>
                <button onClick={() => setShowUpload(!showUpload)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg text-sm hover:bg-primary/20 transition-all">
                    <Upload className="w-4 h-4" /> Nova Conta
                </button>
            </div>

            {/* Upload Form */}
            {showUpload && (
                <form onSubmit={handleUpload} className="p-5 rounded-xl bg-white/[0.02] border border-primary/20 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-white/40 block mb-1">Mês Referência *</label>
                            <input type="month" value={refMonth} onChange={e => setRefMonth(e.target.value)} required
                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-primary/30" />
                        </div>
                        <div>
                            <label className="text-xs text-white/40 block mb-1">Vencimento</label>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-primary/30" />
                        </div>
                        <div>
                            <label className="text-xs text-white/40 block mb-1">Valor Total (R$)</label>
                            <input type="number" step="0.01" value={totalValue} onChange={e => setTotalValue(e.target.value)}
                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-primary/30" />
                        </div>
                        <div>
                            <label className="text-xs text-white/40 block mb-1">Créditos Injetados (kWh)</label>
                            <input type="number" step="0.1" value={injected} onChange={e => setInjected(e.target.value)}
                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-primary/30" />
                        </div>
                        <div>
                            <label className="text-xs text-white/40 block mb-1">Consumo Rede (kWh)</label>
                            <input type="number" step="0.1" value={consumption} onChange={e => setConsumption(e.target.value)}
                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-primary/30" />
                        </div>
                        <div>
                            <label className="text-xs text-white/40 block mb-1">Economia (R$)</label>
                            <input type="number" step="0.01" value={savings} onChange={e => setSavings(e.target.value)}
                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-primary/30" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-white/40 block mb-1">PDF da Conta</label>
                        <input ref={fileRef} type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)}
                            className="text-sm text-white/50 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-white/[0.08] file:bg-white/[0.03] file:text-white/70 file:text-sm hover:file:bg-white/[0.06] file:transition-all" />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 text-white/40 hover:text-white text-sm">Cancelar</button>
                        <button type="submit" disabled={uploading || !refMonth}
                            className="flex items-center gap-2 px-5 py-2 bg-primary text-black font-semibold rounded-lg text-sm disabled:opacity-50">
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            Salvar Conta
                        </button>
                    </div>
                </form>
            )}

            {/* Bills List */}
            {bills.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-8">Nenhuma conta cadastrada</p>
            ) : (
                <div className="space-y-2">
                    {bills.map(bill => (
                        <div key={bill.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                            <div>
                                <p className="text-sm text-white font-medium">{bill.reference_month}</p>
                                <div className="flex items-center gap-4 mt-1">
                                    {bill.total_value != null && <span className="text-xs text-white/40">R$ {bill.total_value.toFixed(2)}</span>}
                                    {bill.savings != null && <span className="text-xs text-emerald-400">Economia: R$ {bill.savings.toFixed(2)}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {bill.pdf_url && (
                                    <a href={bill.pdf_url} target="_blank" rel="noopener noreferrer"
                                        className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-all">
                                        <Download className="w-4 h-4" />
                                    </a>
                                )}
                                <button onClick={async () => {
                                    if (!confirm('Deletar esta conta?')) return;
                                    await clientService.deleteBill(bill.id);
                                    onReload();
                                }}
                                    className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Tab: Tickets ──────────────────────────────────────

function TicketsTab({ tickets, onReload, formatDate }: { tickets: SupportTicket[]; onReload: () => void; formatDate: (s: string | null) => string }) {
    const [responding, setResponding] = useState<string | null>(null);
    const [response, setResponse] = useState('');

    async function handleRespond(ticketId: string) {
        if (!response.trim()) return;
        try {
            await clientService.respondTicket(ticketId, response);
            setResponding(null);
            setResponse('');
            onReload();
        } catch { }
    }

    const statusColors: Record<string, string> = {
        aberto: 'bg-amber-500/10 text-amber-400',
        em_andamento: 'bg-blue-500/10 text-blue-400',
        resolvido: 'bg-emerald-500/10 text-emerald-400',
        fechado: 'bg-white/5 text-white/30',
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Chamados de Suporte</h3>

            {tickets.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-8">Nenhum chamado</p>
            ) : (
                <div className="space-y-3">
                    {tickets.map(ticket => (
                        <div key={ticket.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm text-white font-semibold">{ticket.subject}</h4>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[ticket.status] || ''}`}>
                                    {ticket.status}
                                </span>
                            </div>
                            {ticket.description && <p className="text-sm text-white/50">{ticket.description}</p>}
                            <p className="text-xs text-white/30">{formatDate(ticket.created_at)}</p>

                            {ticket.admin_response && (
                                <div className="mt-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                    <p className="text-xs text-emerald-400 font-medium mb-1">Resposta do Admin:</p>
                                    <p className="text-sm text-white/60">{ticket.admin_response}</p>
                                </div>
                            )}

                            {!ticket.admin_response && ticket.status === 'aberto' && (
                                responding === ticket.id ? (
                                    <div className="flex gap-2 mt-2">
                                        <input value={response} onChange={e => setResponse(e.target.value)} placeholder="Escreva a resposta..."
                                            className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-primary/30" />
                                        <button onClick={() => handleRespond(ticket.id)} className="px-4 py-2 bg-primary text-black rounded-lg text-sm font-semibold">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => setResponding(ticket.id)}
                                        className="text-xs text-primary hover:underline">
                                        Responder chamado
                                    </button>
                                )
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
