import { useState, useEffect } from 'react';
import { X, Send, Loader2, Users, User, Bell } from 'lucide-react';
import { clientService, ClientAccount } from '@/services/clientService';
import { clientNotificationService, SendNotificationPayload } from '@/services/clientNotificationService';

interface SendNotificationModalProps {
    onClose: () => void;
    onSent?: () => void;
}

const NOTIFICATION_TYPES = [
    { value: 'general', label: 'Geral', color: 'text-blue-400' },
    { value: 'billing', label: 'Faturamento', color: 'text-emerald-400' },
    { value: 'maintenance', label: 'Manutenção', color: 'text-amber-400' },
    { value: 'promo', label: 'Promoção', color: 'text-violet-400' },
    { value: 'system', label: 'Sistema', color: 'text-red-400' },
];

const DEEP_LINK_ROUTES = [
    { value: '/home', label: 'Home' },
    { value: '/energy', label: 'Energia' },
    { value: '/bills', label: 'Conta de Luz' },
    { value: '/profile', label: 'Perfil' },
    { value: '/notifications', label: 'Notificações' },
];

export default function SendNotificationModal({ onClose, onSent }: SendNotificationModalProps) {
    const [clients, setClients] = useState<ClientAccount[]>([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [type, setType] = useState('general');
    const [targetMode, setTargetMode] = useState<'all' | 'specific'>('all');
    const [targetUserId, setTargetUserId] = useState('');
    const [route, setRoute] = useState('/home');

    useEffect(() => {
        loadClients();
    }, []);

    async function loadClients() {
        try {
            const data = await clientService.getClients();
            setClients(data.filter(c => c.status === 'ativo'));
        } catch {
            // Falha silenciosa
        } finally {
            setLoadingClients(false);
        }
    }

    async function handleSend() {
        if (!title.trim() || !body.trim()) {
            setError('Título e mensagem são obrigatórios.');
            return;
        }
        if (targetMode === 'specific' && !targetUserId) {
            setError('Selecione um cliente para enviar.');
            return;
        }

        setSending(true);
        setError(null);

        try {
            const payload: SendNotificationPayload = {
                title: title.trim(),
                body: body.trim(),
                type,
                route,
                target_user_id: targetMode === 'specific' ? targetUserId : null,
            };

            await clientNotificationService.sendNotification(payload);
            setSuccess(true);
            onSent?.();

            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (e: any) {
            setError(e.message || 'Erro ao enviar notificação.');
        } finally {
            setSending(false);
        }
    }

    const inputClass = "w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-primary/30 transition-all";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-[#0d1117] border border-white/[0.08] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Enviar Notificação</h3>
                            <p className="text-xs text-white/40">Push notification para o Gridon+ (app do cliente)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Success State */}
                {success ? (
                    <div className="p-10 text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                            <Send className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-white">Notificação Enviada!</h4>
                        <p className="text-sm text-white/40 mt-2">Os clientes receberão a notificação em instantes.</p>
                    </div>
                ) : (
                    /* Form */
                    <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
                        {/* Título */}
                        <div>
                            <label className="text-xs font-medium text-white/50 block mb-1.5">Título *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ex: Sua conta de energia chegou!"
                                maxLength={80}
                                className={inputClass}
                            />
                            <p className="text-[10px] text-white/30 mt-1 text-right">{title.length}/80</p>
                        </div>

                        {/* Mensagem */}
                        <div>
                            <label className="text-xs font-medium text-white/50 block mb-1.5">Mensagem *</label>
                            <textarea
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                placeholder="Escreva a mensagem que o cliente verá na notificação..."
                                rows={3}
                                className={inputClass + ' resize-none'}
                            />
                        </div>

                        {/* Tipo */}
                        <div>
                            <label className="text-xs font-medium text-white/50 block mb-1.5">Tipo</label>
                            <div className="flex flex-wrap gap-2">
                                {NOTIFICATION_TYPES.map(t => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => setType(t.value)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                            type === t.value
                                                ? 'bg-primary/10 border-primary/30 text-primary'
                                                : 'bg-white/[0.02] border-white/[0.08] text-white/50 hover:border-white/20'
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Destinatário */}
                        <div>
                            <label className="text-xs font-medium text-white/50 block mb-1.5">Destinatário</label>
                            <div className="flex gap-3 mb-3">
                                <button
                                    type="button"
                                    onClick={() => { setTargetMode('all'); setTargetUserId(''); }}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all flex-1 ${
                                        targetMode === 'all'
                                            ? 'bg-primary/10 border-primary/30 text-primary'
                                            : 'bg-white/[0.02] border-white/[0.08] text-white/50 hover:border-white/20'
                                    }`}
                                >
                                    <Users className="w-4 h-4" />
                                    Todos os Clientes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTargetMode('specific')}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all flex-1 ${
                                        targetMode === 'specific'
                                            ? 'bg-primary/10 border-primary/30 text-primary'
                                            : 'bg-white/[0.02] border-white/[0.08] text-white/50 hover:border-white/20'
                                    }`}
                                >
                                    <User className="w-4 h-4" />
                                    Cliente Específico
                                </button>
                            </div>

                            {targetMode === 'specific' && (
                                <select
                                    value={targetUserId}
                                    onChange={e => setTargetUserId(e.target.value)}
                                    className={inputClass + ' appearance-none'}
                                >
                                    <option value="" className="bg-slate-900">Selecione um cliente...</option>
                                    {loadingClients ? (
                                        <option disabled className="bg-slate-900">Carregando...</option>
                                    ) : (
                                        clients.map(c => (
                                            <option key={c.user_id} value={c.user_id} className="bg-slate-900">
                                                {c.full_name} ({c.email})
                                            </option>
                                        ))
                                    )}
                                </select>
                            )}
                        </div>

                        {/* Rota de Deep Link */}
                        <div>
                            <label className="text-xs font-medium text-white/50 block mb-1.5">Abrir tela ao clicar</label>
                            <select
                                value={route}
                                onChange={e => setRoute(e.target.value)}
                                className={inputClass + ' appearance-none'}
                            >
                                {DEEP_LINK_ROUTES.map(r => (
                                    <option key={r.value} value={r.value} className="bg-slate-900">
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-white/30 mt-1">Quando o cliente tocar na notificação, será direcionado para esta tela.</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                {!success && (
                    <div className="flex items-center justify-end gap-3 p-5 border-t border-white/[0.06]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={sending || !title.trim() || !body.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Enviar Notificação
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
