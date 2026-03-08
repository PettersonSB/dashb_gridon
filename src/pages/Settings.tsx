import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profileService';
import { Camera, Save, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Settings() {
    const { user } = useAuth();

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

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    return (
        <div className="animate-fade-in space-y-6 pb-20 max-w-4xl mx-auto">
            <div>
                <h2 className="section-title !mb-0">Configurações da Conta</h2>
                <p className="section-subtitle">Gerencie seu perfil de administrador e credenciais de acesso</p>
            </div>

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

            </div>
        </div>
    );
}
