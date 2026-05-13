import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { teamService } from '@/services/teamService';
import { ALL_PERMISSIONS, PERMISSION_PRESETS } from '@/lib/types';
import type { TeamMember, TeamPermissions, TeamRole } from '@/lib/types';
import { Users, Plus, Loader2, Shield, ShieldCheck, Crown, MoreVertical, KeyRound, Pause, Play, Trash2, Pencil, AlertCircle, CheckCircle2, X, Eye, EyeOff, Sparkles, Settings2 } from 'lucide-react';

const ROLE_LABELS: Record<string, { label: string; color: string; icon: typeof Crown }> = {
    owner: { label: 'Super Admin', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Crown },
    admin: { label: 'Administrador', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: ShieldCheck },
    vendedor: { label: 'Vendedor', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: Shield },
};

function generatePassword(len = 8) {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function TeamTab() {
    const { user } = useAuth();
    const { isOwner, isAdmin } = usePermissions();

    const [members, setMembers] = useState<TeamMember[]>([]);
    const [maxMembers, setMaxMembers] = useState(6);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editMember, setEditMember] = useState<TeamMember | null>(null);
    const [actionMenu, setActionMenu] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Limit editor
    const [editingLimit, setEditingLimit] = useState(false);
    const [limitValue, setLimitValue] = useState(6);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        const [m, max] = await Promise.all([teamService.getTeamMembers(), teamService.getMaxMembers()]);
        setMembers(m);
        setMaxMembers(max);
        setLimitValue(max);
        setLoading(false);
    };

    const flash = (type: string, text: string) => {
        setMsg({ type, text });
        setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    };

    const handleSaveLimit = async () => {
        if (limitValue < members.length) {
            flash('error', `O limite não pode ser menor que o total atual (${members.length})`);
            return;
        }
        try {
            await teamService.setMaxMembers(limitValue);
            setMaxMembers(limitValue);
            setEditingLimit(false);
            flash('success', 'Limite atualizado');
        } catch { flash('error', 'Erro ao salvar limite'); }
    };

    const handleAction = async (action: string, member: TeamMember) => {
        setActionMenu(null);
        setActionLoading(member.user_id);
        try {
            if (action === 'suspend') { await teamService.suspendMember(member.user_id); flash('success', `${member.full_name} suspenso`); }
            else if (action === 'reactivate') { await teamService.reactivateMember(member.user_id); flash('success', `${member.full_name} reativado`); }
            else if (action === 'delete') {
                if (!confirm(`Remover ${member.full_name} permanentemente?`)) { setActionLoading(null); return; }
                await teamService.deleteMember(member.user_id);
                flash('success', `${member.full_name} removido`);
            } else if (action === 'reset') {
                const pw = generatePassword();
                await teamService.resetPassword(member.user_id, pw);
                flash('success', `Senha resetada para: ${pw}`);
            }
            await loadData();
        } catch (e: any) { flash('error', e.message); }
        setActionLoading(null);
    };

    const canEditMember = (m: TeamMember) => {
        if (m.role === 'owner') return false;
        if (isOwner) return true;
        if (isAdmin && m.role === 'vendedor') return true;
        return false;
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Equipe</h3>
                        <p className="text-xs text-white/40">{members.filter(m => m.role !== 'owner').length} de {maxMembers} membros</p>
                    </div>
                    {isOwner && (
                        editingLimit ? (
                            <div className="flex items-center gap-2 ml-2">
                                <input type="number" min={members.length} max={50} value={limitValue} onChange={e => setLimitValue(Number(e.target.value))}
                                    className="form-input !w-16 !py-1 text-center text-sm" />
                                <button onClick={handleSaveLimit} className="text-xs text-primary hover:underline">Salvar</button>
                                <button onClick={() => { setEditingLimit(false); setLimitValue(maxMembers); }} className="text-xs text-white/40 hover:text-white">Cancelar</button>
                            </div>
                        ) : (
                            <button onClick={() => setEditingLimit(true)} className="ml-2 p-1 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors" title="Alterar limite">
                                <Settings2 className="w-3.5 h-3.5" />
                            </button>
                        )
                    )}
                </div>
                <button onClick={() => setShowCreateModal(true)} disabled={members.length >= maxMembers}
                    className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Plus className="w-4 h-4" /> Novo Membro
                </button>
            </div>

            {msg.text && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${msg.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {msg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{msg.text}
                </div>
            )}

            {/* Members List */}
            <div className="space-y-2">
                {members.filter(m => m.role !== 'owner').map(m => {
                    const roleInfo = ROLE_LABELS[m.role] || ROLE_LABELS.vendedor;
                    const RoleIcon = roleInfo.icon;
                    const isSelf = m.user_id === user?.id;
                    return (
                        <div key={m.id} className={`glass-card p-4 flex items-center gap-4 ${m.status === 'suspenso' ? 'opacity-50' : ''}`}>
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                                {m.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-white truncate">{m.full_name}{isSelf ? ' (você)' : ''}</p>
                                    {m.status === 'suspenso' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Suspenso</span>}
                                </div>
                                <p className="text-xs text-white/40 truncate">{m.email}</p>
                            </div>
                            <span className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${roleInfo.color}`}>
                                <RoleIcon className="w-3 h-3" />{roleInfo.label}
                            </span>
                            {canEditMember(m) && (
                                <div className="relative">
                                    {actionLoading === m.user_id ? <Loader2 className="w-4 h-4 animate-spin text-white/40" /> : (
                                        <button onClick={() => setActionMenu(actionMenu === m.user_id ? null : m.user_id)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    )}
                                    {actionMenu === m.user_id && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-[hsl(228,25%,12%)] border border-white/[0.08] rounded-xl shadow-2xl z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                                                <button onClick={() => { setActionMenu(null); setEditMember(m); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"><Pencil className="w-3.5 h-3.5" />Editar permissões</button>
                                                <button onClick={() => handleAction('reset', m)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"><KeyRound className="w-3.5 h-3.5" />Resetar senha</button>
                                                {m.status === 'ativo'
                                                    ? <button onClick={() => handleAction('suspend', m)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10"><Pause className="w-3.5 h-3.5" />Suspender</button>
                                                    : <button onClick={() => handleAction('reactivate', m)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10"><Play className="w-3.5 h-3.5" />Reativar</button>
                                                }
                                                <div className="border-t border-white/[0.06] my-1" />
                                                <button onClick={() => handleAction('delete', m)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" />Excluir</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Create Modal */}
            {showCreateModal && <MemberModal onClose={() => setShowCreateModal(false)} onSaved={() => { setShowCreateModal(false); loadData(); flash('success', 'Membro criado!'); }} isOwner={isOwner} />}

            {/* Edit Modal */}
            {editMember && <MemberModal member={editMember} onClose={() => setEditMember(null)} onSaved={() => { setEditMember(null); loadData(); flash('success', 'Permissões atualizadas!'); }} isOwner={isOwner} />}
        </div>
    );
}

// ── Modal de Criar/Editar Membro ──────────────────────────

function MemberModal({ member, onClose, onSaved, isOwner }: { member?: TeamMember; onClose: () => void; onSaved: () => void; isOwner: boolean }) {
    const isEdit = !!member;
    const [email, setEmail] = useState(member?.email || '');
    const [fullName, setFullName] = useState(member?.full_name || '');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [role, setRole] = useState<TeamRole>(member?.role || 'vendedor');
    const [perms, setPerms] = useState<TeamPermissions>(member?.permissions || {});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const togglePerm = (mod: string, key: string) => {
        setPerms(prev => {
            const arr = prev[mod as keyof TeamPermissions] || [];
            const next = arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key];
            return { ...prev, [mod]: next };
        });
    };

    const toggleModule = (mod: string, allKeys: string[]) => {
        const current = perms[mod as keyof TeamPermissions] || [];
        const allSelected = allKeys.every(k => current.includes(k));
        setPerms(prev => ({ ...prev, [mod]: allSelected ? [] : [...allKeys] }));
    };

    const applyPreset = (presetKey: string) => {
        const preset = PERMISSION_PRESETS[presetKey];
        if (preset) setPerms({ ...preset.permissions });
    };

    const handleSubmit = async () => {
        setError('');
        if (!isEdit && (!email || !fullName || !password)) { setError('Preencha todos os campos'); return; }
        if (!isEdit && password.length < 6) { setError('Senha deve ter no mínimo 6 caracteres'); return; }
        setSaving(true);
        try {
            if (isEdit) {
                await teamService.updateMember(member!.user_id, { role, permissions: perms });
            } else {
                await teamService.createMember({ email, password, full_name: fullName, role, permissions: perms });
            }
            onSaved();
        } catch (e: any) { setError(e.message); }
        setSaving(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-[hsl(228,25%,10%)] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                        <h3 className="text-lg font-semibold text-white">{isEdit ? 'Editar Membro' : 'Novo Membro'}</h3>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>

                    <div className="p-6 space-y-5">
                        {error && <div className="flex items-center gap-2 p-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20"><AlertCircle className="w-4 h-4" />{error}</div>}

                        {/* Campos básicos */}
                        {!isEdit && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="form-label">Nome completo</label><input type="text" className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="João Silva" /></div>
                                <div><label className="form-label">Email</label><input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@gridon.com.br" /></div>
                                <div className="sm:col-span-2">
                                    <label className="form-label">Senha provisória</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input type={showPw ? 'text' : 'password'} className="form-input !pr-10" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                                            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <button type="button" onClick={() => { setPassword(generatePassword()); setShowPw(true); }}
                                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium border border-white/10 transition-colors whitespace-nowrap">
                                            <Sparkles className="w-3.5 h-3.5 inline mr-1" />Gerar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isEdit && <div><label className="form-label">Email</label><input type="email" className="form-input opacity-50 cursor-not-allowed" value={email} disabled /><span className="text-[11px] text-white/30 mt-1 block">O email não pode ser alterado.</span></div>}

                        {/* Role */}
                        <div>
                            <label className="form-label">Função</label>
                            <div className="flex gap-2">
                                {isOwner && (
                                    <button type="button" onClick={() => { setRole('admin'); applyPreset('admin'); }}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${role === 'admin' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-white/[0.03] border-white/10 text-white/50 hover:bg-white/[0.06]'}`}>
                                        <ShieldCheck className="w-4 h-4" />Administrador
                                    </button>
                                )}
                                <button type="button" onClick={() => { setRole('vendedor'); applyPreset('vendedor'); }}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${role === 'vendedor' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/[0.03] border-white/10 text-white/50 hover:bg-white/[0.06]'}`}>
                                    <Shield className="w-4 h-4" />Vendedor
                                </button>
                            </div>
                        </div>

                        {/* Permissions Grid */}
                        <div>
                            <label className="form-label mb-3">Permissões de Acesso</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {Object.entries(ALL_PERMISSIONS).map(([mod, { label, items }]) => {
                                    const current = perms[mod as keyof TeamPermissions] || [];
                                    const allSelected = items.every(i => current.includes(i.key));
                                    return (
                                        <div key={mod} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</span>
                                                <button type="button" onClick={() => toggleModule(mod, items.map(i => i.key))}
                                                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors ${allSelected ? 'text-red-400 hover:bg-red-500/10' : 'text-primary hover:bg-primary/10'}`}>
                                                    {allSelected ? 'Desmarcar' : 'Tudo'}
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                {items.map(item => (
                                                    <label key={item.key} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-white/[0.04] cursor-pointer transition-colors">
                                                        <input type="checkbox" checked={current.includes(item.key)} onChange={() => togglePerm(mod, item.key)}
                                                            className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/30 focus:ring-offset-0" />
                                                        <span className="text-xs text-white/70">{item.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-white/[0.06]">
                        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
                        <button onClick={handleSubmit} disabled={saving}
                            className="bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Membro'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
