import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2, AlertCircle, CheckCircle2, Smartphone, Trash2, FileUp, Package, X, ToggleLeft, ToggleRight, Download } from 'lucide-react';

interface AppVersion {
    id: string;
    app_name: string;
    version: string;
    build_number: number;
    apk_url: string;
    mandatory: boolean;
    changelog: string;
    created_at: string;
}

const APP_OPTIONS = [
    { value: 'gridon_app', label: 'Gridon App', description: 'App administrativo', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { value: 'gridon_client', label: 'Gridon+', description: 'App do cliente', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
];

export default function AppUpdateTab() {
    const [versions, setVersions] = useState<AppVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Upload form
    const [showForm, setShowForm] = useState(false);
    const [appName, setAppName] = useState('gridon_client');
    const [version, setVersion] = useState('');
    const [buildNumber, setBuildNumber] = useState('');
    const [changelog, setChangelog] = useState('');
    const [mandatory, setMandatory] = useState(false);
    const [apkFile, setApkFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { loadVersions(); }, []);

    const loadVersions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_versions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && data) setVersions(data as AppVersion[]);
        } catch { /* silent */ }
        setLoading(false);
    };

    const flash = (type: string, text: string) => {
        setMsg({ type, text });
        setTimeout(() => setMsg({ type: '', text: '' }), 5000);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.apk')) {
                flash('error', 'Selecione um arquivo .APK válido');
                return;
            }
            setApkFile(file);
        }
    };

    const handleUpload = async () => {
        if (!apkFile) { flash('error', 'Selecione o arquivo .APK'); return; }
        if (!version.trim()) { flash('error', 'Informe a versão (ex: 1.2.0)'); return; }
        if (!buildNumber.trim() || isNaN(Number(buildNumber))) { flash('error', 'Informe um build number válido'); return; }

        setUploading(true);
        setUploadProgress(10);

        try {
            const fileName = `${appName}/${appName}_v${version}_b${buildNumber}.apk`;

            setUploadProgress(20);
            const { error: uploadError } = await supabase.storage
                .from('app-releases')
                .upload(fileName, apkFile, {
                    upsert: true,
                    contentType: 'application/vnd.android.package-archive',
                });

            if (uploadError) throw new Error('Erro no upload: ' + uploadError.message);
            setUploadProgress(60);

            const { data: { publicUrl } } = supabase.storage
                .from('app-releases')
                .getPublicUrl(fileName);

            setUploadProgress(80);

            const { error: insertError } = await supabase
                .from('app_versions')
                .insert({
                    app_name: appName,
                    version: version.trim(),
                    build_number: parseInt(buildNumber),
                    apk_url: publicUrl,
                    mandatory,
                    changelog: changelog.trim(),
                });

            if (insertError) throw new Error('Erro ao salvar versão: ' + insertError.message);
            setUploadProgress(100);

            flash('success', `APK v${version} enviado com sucesso!`);
            resetForm();
            await loadVersions();
        } catch (e: any) {
            flash('error', e.message);
        }
        setUploading(false);
        setUploadProgress(0);
    };

    const handleDelete = async (v: AppVersion) => {
        if (!confirm(`Excluir versão ${v.version} (${v.app_name})?`)) return;
        try {
            const path = `${v.app_name}/${v.app_name}_v${v.version}_b${v.build_number}.apk`;
            await supabase.storage.from('app-releases').remove([path]);
            const { error } = await supabase.from('app_versions').delete().eq('id', v.id);
            if (error) throw error;
            flash('success', `Versão ${v.version} excluída`);
            await loadVersions();
        } catch (e: any) {
            flash('error', e.message);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setVersion('');
        setBuildNumber('');
        setChangelog('');
        setMandatory(false);
        setApkFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Split versions by app
    const gridonAppVersions = versions.filter(v => v.app_name === 'gridon_app');
    const gridonClientVersions = versions.filter(v => v.app_name === 'gridon_client');

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Package className="w-5 h-5 text-primary" /></div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Atualizações</h3>
                        <p className="text-xs text-white/40">Gerencie versões dos aplicativos Android</p>
                    </div>
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                    {showForm ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    {showForm ? 'Cancelar' : 'Nova Atualização'}
                </button>
            </div>

            {msg.text && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${msg.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {msg.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}{msg.text}
                </div>
            )}

            {/* Upload Form */}
            {showForm && (
                <div className="glass-card p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                        <label className="form-label">Aplicativo</label>
                        <div className="flex gap-2">
                            {APP_OPTIONS.map(opt => (
                                <button key={opt.value} type="button" onClick={() => setAppName(opt.value)}
                                    className={`flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${appName === opt.value ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/[0.03] border-white/10 text-white/50 hover:bg-white/[0.06]'}`}>
                                    <Smartphone className="w-5 h-5" />
                                    <span>{opt.label}</span>
                                    <span className="text-[10px] opacity-60">{opt.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Versão</label>
                            <input type="text" className="form-input" value={version} onChange={e => setVersion(e.target.value)} placeholder="1.2.0" />
                        </div>
                        <div>
                            <label className="form-label">Build Number</label>
                            <input type="number" className="form-input" value={buildNumber} onChange={e => setBuildNumber(e.target.value)} placeholder="12" />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Changelog (opcional)</label>
                        <textarea className="form-input min-h-[80px] resize-y" value={changelog} onChange={e => setChangelog(e.target.value)}
                            placeholder="• Correção de bugs&#10;• Nova funcionalidade X" />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div>
                            <p className="text-sm text-white/80">Atualização obrigatória</p>
                            <p className="text-[11px] text-white/40">Força o usuário a atualizar antes de usar o app</p>
                        </div>
                        <button type="button" onClick={() => setMandatory(!mandatory)} className="text-primary">
                            {mandatory ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-white/30" />}
                        </button>
                    </div>

                    <div>
                        <label className="form-label">Arquivo APK</label>
                        <input ref={fileInputRef} type="file" accept=".apk" onChange={handleFileSelect} className="hidden" />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-white/10 hover:border-primary/30 bg-white/[0.02] hover:bg-primary/5 cursor-pointer transition-all"
                        >
                            {apkFile ? (
                                <>
                                    <FileUp className="w-8 h-8 text-primary" />
                                    <p className="text-sm text-white font-medium">{apkFile.name}</p>
                                    <p className="text-xs text-white/40">{formatSize(apkFile.size)}</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-white/20" />
                                    <p className="text-sm text-white/50">Clique para selecionar o .APK</p>
                                    <p className="text-xs text-white/30">ou arraste o arquivo aqui</p>
                                </>
                            )}
                        </div>
                    </div>

                    {uploading && (
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <div className="bg-primary h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${uploadProgress}%` }} />
                        </div>
                    )}

                    <button onClick={handleUpload} disabled={uploading}
                        className="w-full bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando ({uploadProgress}%)...</> : <><Upload className="w-4 h-4" />Enviar Atualização</>}
                    </button>
                </div>
            )}

            {/* Two-Column Versions List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gridon App Column */}
                <VersionColumn
                    title="Gridon App"
                    subtitle="App administrativo"
                    accentColor="amber"
                    versions={gridonAppVersions}
                    onDelete={handleDelete}
                />

                {/* Gridon+ Column */}
                <VersionColumn
                    title="Gridon+"
                    subtitle="App do cliente"
                    accentColor="cyan"
                    versions={gridonClientVersions}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
}

// ── Sub-component: Version Column ─────────────────────────

function VersionColumn({ title, subtitle, accentColor, versions, onDelete }: {
    title: string;
    subtitle: string;
    accentColor: 'amber' | 'cyan';
    versions: AppVersion[];
    onDelete: (v: AppVersion) => void;
}) {
    const colors = {
        amber: {
            header: 'from-amber-500/10 to-transparent border-amber-500/15',
            icon: 'bg-amber-500/10 text-amber-400',
            badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            dot: 'bg-amber-400',
        },
        cyan: {
            header: 'from-cyan-500/10 to-transparent border-cyan-500/15',
            icon: 'bg-cyan-500/10 text-cyan-400',
            badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
            dot: 'bg-cyan-400',
        },
    }[accentColor];

    return (
        <div className={`rounded-2xl border bg-gradient-to-b ${colors.header} overflow-hidden`}>
            {/* Column Header */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${colors.icon} flex items-center justify-center`}>
                    <Smartphone className="w-4 h-4" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-white">{title}</h4>
                    <p className="text-[10px] text-white/35">{subtitle}</p>
                </div>
                <span className="ml-auto text-[10px] text-white/30 font-medium">{versions.length} versões</span>
            </div>

            {/* Version Items */}
            <div className="p-2 space-y-1.5 max-h-[400px] overflow-y-auto custom-scrollbar">
                {versions.length === 0 ? (
                    <div className="text-center py-8 text-white/25 text-xs">Nenhuma versão publicada</div>
                ) : (
                    versions.map(v => (
                        <div key={v.id} className="group rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/[0.08] p-3 transition-all">
                            <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    {/* Version badges row */}
                                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${colors.badge}`}>
                                            <span className={`w-1 h-1 rounded-full ${colors.dot}`} />
                                            v{v.version} · b{v.build_number}
                                        </span>
                                        {v.mandatory && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
                                                Obrigatória
                                            </span>
                                        )}
                                    </div>

                                    {/* Changelog */}
                                    <p className="text-[11px] text-white/45 leading-relaxed line-clamp-2">{v.changelog || 'Sem changelog'}</p>

                                    {/* Date */}
                                    <p className="text-[9px] text-white/20 mt-1">
                                        {new Date(v.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href={v.apk_url} target="_blank" rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-primary transition-colors" title="Baixar">
                                        <Download className="w-3.5 h-3.5" />
                                    </a>
                                    <button onClick={() => onDelete(v)}
                                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors" title="Excluir">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
