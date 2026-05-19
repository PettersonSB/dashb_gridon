import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { profileService } from '@/services/profileService';
import { settingsService } from '@/services/settingsService';
import { supabase } from '@/lib/supabase';
import TeamTab from '@/components/TeamTab';
import AppUpdateTab from '@/components/AppUpdateTab';
import { Camera, Save, Lock, Loader2, AlertCircle, CheckCircle2, Globe, Sun, Moon, Smartphone, Download, ChevronRight, Sparkles, Users, User, Package } from 'lucide-react';

interface AppVersion {
    id: string;
    version: string;
    build_number: number;
    apk_url: string;
    mandatory: boolean;
    changelog: string;
    created_at: string;
}

export default function Settings() {
    const { user } = useAuth();
    const { canManageTeam, isOwner } = usePermissions();
    const [activeTab, setActiveTab] = useState<'conta' | 'equipe' | 'atualizacoes'>('conta');

    // Form State - Profile
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>(user?.user_metadata?.avatar_url || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

    // Form State - Security
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    // Form State - Global Settings
    const [siteTheme, setSiteTheme] = useState('dark');
    const [isSavingSiteTheme, setIsSavingSiteTheme] = useState(false);
    const [themeMessage, setThemeMessage] = useState({ type: '', text: '' });

    // App Download State
    const [appVersion, setAppVersion] = useState<AppVersion | null>(null);
    const [isLoadingApp, setIsLoadingApp] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadSettings = async () => {
            const theme = await settingsService.getSetting('site_theme', 'dark');
            setSiteTheme(theme);
        };
        loadSettings();
        fetchLatestAppVersion();
    }, []);

    const fetchLatestAppVersion = async () => {
        try {
            const { data, error } = await supabase
                .from('app_versions')
                .select('*')
                .order('build_number', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!error && data) {
                setAppVersion(data as AppVersion);
            }
        } catch {
            // Silently fail
        } finally {
            setIsLoadingApp(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMessage({ type: '', text: '' });
        setIsSavingProfile(true);

        try {
            await profileService.updateProfile(fullName, avatarFile);
            setProfileMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            setAvatarFile(null); // Limpa o arquivo selecionado pois já foi enviado
            setTimeout(() => window.location.reload(), 1500); // Recarrega para atualizar a UI lateral
        } catch (error) {
            console.error(error);
            setProfileMessage({ type: 'error', text: 'Erro ao atualizar o perfil. Tente novamente.' });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });

        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'As senhas não coincidem.' });
            return;
        }

        setIsSavingPassword(true);

        try {
            await profileService.updatePassword(newPassword);
            setPasswordMessage({ type: 'success', text: 'Senha atualizada com segurança.' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error(error);
            setPasswordMessage({ type: 'error', text: 'Erro ao atualizar a senha.' });
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleSaveTheme = async () => {
        setIsSavingSiteTheme(true);
        setThemeMessage({ type: '', text: '' });
        try {
            await settingsService.updateSetting('site_theme', siteTheme);
            setThemeMessage({ type: 'success', text: 'Tema atualizado com sucesso!' });
            setTimeout(() => setThemeMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setThemeMessage({ type: 'error', text: 'Erro ao atualizar o tema.' });
        } finally {
            setIsSavingSiteTheme(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-6 pb-20 max-w-4xl mx-auto">
            <div>
                <h2 className="section-title !mb-0">Configurações</h2>
                <p className="section-subtitle">Gerencie sua conta e equipe</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
                <button onClick={() => setActiveTab('conta')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'conta' ? 'bg-primary/10 text-primary' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'}`}>
                    <User className="w-4 h-4" />Conta
                </button>
                {canManageTeam && (
                    <button onClick={() => setActiveTab('equipe')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'equipe' ? 'bg-primary/10 text-primary' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'}`}>
                        <Users className="w-4 h-4" />Equipe
                    </button>
                )}
                {isOwner && (
                    <button onClick={() => setActiveTab('atualizacoes')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'atualizacoes' ? 'bg-primary/10 text-primary' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'}`}>
                        <Package className="w-4 h-4" />Atualizações
                    </button>
                )}
            </div>

            {/* Tab: Equipe */}
            {activeTab === 'equipe' && canManageTeam && (
                <TeamTab />
            )}

            {/* Tab: Atualizações (owner only) */}
            {activeTab === 'atualizacoes' && isOwner && (
                <AppUpdateTab />
            )}

            {/* Tab: Conta */}
            {activeTab === 'conta' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Bloco: Perfil */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                        Perfil Público
                    </h3>

                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center">
                            <div className="relative group cursor-pointer mb-2" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-white/5 border-2 border-white/10 group-hover:border-primary/50 transition-colors flex items-center justify-center">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold text-primary">
                                            {fullName?.charAt(0).toUpperCase() || user?.email?.[0].toUpperCase() || "G"}
                                        </span>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <span className="text-xs text-white/40">Clique para alterar a foto</span>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        {profileMessage.text && (
                            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${profileMessage.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                {profileMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                {profileMessage.text}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="form-label">Nome de Exibição</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="João Silva"
                                />
                            </div>

                            <div>
                                <label className="form-label">Email de Acesso (Login)</label>
                                <input
                                    type="email"
                                    className="form-input opacity-50 cursor-not-allowed"
                                    value={user?.email || ''}
                                    disabled
                                />
                                <span className="text-[11px] text-white/30 mt-1 block">O email administrativo não pode ser alterado por aqui.</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSavingProfile}
                            className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full flex items-center justify-center gap-2"
                        >
                            {isSavingProfile ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isSavingProfile ? 'Salvando...' : 'Salvar Perfil'}
                        </button>
                    </form>
                </div>

                {/* Bloco: Segurança */}
                <div className="glass-card p-6 h-fit">
                    <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-amber-500" />
                        Segurança da Conta
                    </h3>

                    <form onSubmit={handleSavePassword} className="space-y-6">

                        {passwordMessage.text && (
                            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${passwordMessage.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                {passwordMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                {passwordMessage.text}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="form-label">Nova Senha</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="form-label">Confirmar Nova Senha</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSavingPassword || !newPassword || !confirmPassword}
                            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSavingPassword ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Lock className="w-4 h-4" />
                            )}
                            {isSavingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                        </button>
                    </form>
                </div>

                {/* Bloco: Aparência do Site Principal (Full Width) */}
                <div className="glass-card p-6 md:col-span-2">
                    <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-400" />
                        Aparência do Site Principal
                    </h3>
                    <p className="text-sm text-white/50 mb-6 font-normal">
                        Escolha o tema (Light ou Dark) que será exibido para todos os visitantes do site solar-shine-web.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => setSiteTheme('light')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl border transition-all ${siteTheme === 'light'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.08] hover:text-white'
                                    }`}
                            >
                                <Sun className="w-5 h-5" />
                                <span className="font-medium">Tema Claro</span>
                            </button>

                            <button
                                onClick={() => setSiteTheme('dark')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl border transition-all ${siteTheme === 'dark'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.08] hover:text-white'
                                    }`}
                            >
                                <Moon className="w-5 h-5" />
                                <span className="font-medium">Tema Escuro</span>
                            </button>
                        </div>

                        <button
                            onClick={handleSaveTheme}
                            disabled={isSavingSiteTheme}
                            className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 sm:ml-auto"
                        >
                            {isSavingSiteTheme ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isSavingSiteTheme ? 'Salvando...' : 'Aplicar Tema'}
                        </button>
                    </div>

                    {themeMessage.text && (
                        <div className={`mt-4 flex items-center gap-2 p-3 rounded-xl text-sm ${themeMessage.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                            {themeMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            {themeMessage.text}
                        </div>
                    )}
                </div>

                {/* Bloco: Aplicativo Gridon (Full Width — Compacto) */}
                <div className="glass-card md:col-span-2 p-6">
                    {isLoadingApp ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        </div>
                    ) : !appVersion ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-white/30" />
                            </div>
                            <p className="text-sm text-white/40">Nenhuma versão do app disponível.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Header: icon + info (always row), button below on mobile */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <img
                                        src="/android-chrome-192x192.png"
                                        alt="Gridon App"
                                        className="w-11 h-11 rounded-xl flex-shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <h3 className="text-base font-semibold text-white">Gridon App para Android</h3>
                                        <p className="text-xs text-white/40">Baixe o aplicativo para gerenciar orçamentos pelo celular.</p>
                                    </div>
                                </div>
                                <a
                                    href={appVersion.apk_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto flex-shrink-0 bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Baixar APK
                                </a>
                            </div>

                            {/* Changelog with version badge as header */}
                            {appVersion.changelog && (
                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary mb-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Versão {appVersion.version} · Build {appVersion.build_number}
                                    </span>
                                    <p className="text-sm text-white/50 leading-relaxed whitespace-pre-line">{appVersion.changelog}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
            )}
        </div>
    );
}
