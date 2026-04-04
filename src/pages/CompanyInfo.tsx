import { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle, UploadCloud, Film, X } from "lucide-react";
import { useSupabaseSingle, upsertRow } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import type { CompanyInfo as CompanyInfoType } from "@/lib/types";
import { PortfolioManager } from "@/components/PortfolioManager";

const CompanyInfoPage = () => {
    const { data: company, loading } = useSupabaseSingle<CompanyInfoType>("company_info");
    const [form, setForm] = useState({
        name: "", phone: "", whatsapp: "", email: "",
        address: "", city: "", state: "", zip: "",
        opening_hours: "", instagram: "", facebook: "", linkedin: "",
        institutional_video_url: "",
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [videoError, setVideoError] = useState("");

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setVideoError("");

        if (file.size > 45 * 1024 * 1024) {
            setVideoError("O vídeo excedeu o limite de 45MB.");
            return;
        }

        const url = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.src = url;
        
        let hasError = false;
        await new Promise<void>((resolve) => {
            video.onloadedmetadata = () => {
                if (video.duration > 62) {
                    setVideoError("O vídeo excede o tempo máximo de 1 minuto.");
                    hasError = true;
                }
                resolve();
            };
            video.onerror = () => {
                setVideoError("Arquivo corrompido ou formato inválido.");
                hasError = true;
                resolve();
            };
        });

        if (hasError) return;

        setUploadingVideo(true);

        if (form.institutional_video_url && form.institutional_video_url.includes('company_video')) {
            const oldPath = form.institutional_video_url.split('/company_video/')[1];
            if (oldPath) {
                await supabase.storage.from('company_video').remove([oldPath]);
            }
        }

        const ext = file.name.split('.').pop() || 'mp4';
        const fileName = `${Date.now()}_video.${ext}`;
        const { data, error } = await supabase.storage.from('company_video').upload(fileName, file, { upsert: true });
        
        if (error) {
            console.error('Upload error:', error);
            setVideoError(`Erro ao enviar vídeo: ${error.message || 'Verifique as políticas de Storage no Supabase.'}`);
        } else if (data) {
            const { data: publicData } = supabase.storage.from('company_video').getPublicUrl(data.path);
            set("institutional_video_url", publicData.publicUrl);
            await handleSave(); // Auto save
        }
        setUploadingVideo(false);
    };

    useEffect(() => {
        if (company) {
            setForm({
                name: company.name || "",
                phone: company.phone || "",
                whatsapp: company.whatsapp || "",
                email: company.email || "",
                address: company.address || "",
                city: company.city || "",
                state: company.state || "",
                zip: company.zip || "",
                opening_hours: company.opening_hours || "",
                instagram: company.instagram || "",
                facebook: company.facebook || "",
                linkedin: company.linkedin || "",
                institutional_video_url: company.institutional_video_url || "",
            });
        }
    }, [company]);

    const set = (field: string, value: string) => setForm({ ...form, [field]: value });

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        const { error } = await upsertRow("company_info", {
            ...(company?.id ? { id: company.id } : {}),
            ...form,
            updated_at: new Date().toISOString(),
        });
        setSaving(false);
        if (!error) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    };

    if (loading) {
        return (
            <div className="animate-fade-in flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="section-title">Dados da Empresa</h2>
                    <p className="section-subtitle">Informações exibidas no site e footer</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="glow-btn flex items-center gap-2 text-sm disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
                </button>
            </div>

            <div className="glass-card p-6 space-y-5">
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Geral</h3>
                <div>
                    <label className="form-label">Nome da empresa</label>
                    <input className="form-input" value={form.name} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="form-label">Telefone</label>
                        <input className="form-input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">WhatsApp</label>
                        <input className="form-input" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
                    </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="form-label">Email</label>
                        <input className="form-input" value={form.email} onChange={(e) => set("email", e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">Horário de Funcionamento</label>
                        <input className="form-input" value={form.opening_hours} onChange={(e) => set("opening_hours", e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="glass-card p-6 space-y-5">
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Endereço</h3>
                <div>
                    <label className="form-label">Endereço</label>
                    <input className="form-input" value={form.address} onChange={(e) => set("address", e.target.value)} />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                        <label className="form-label">Cidade</label>
                        <input className="form-input" value={form.city} onChange={(e) => set("city", e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">Estado</label>
                        <input className="form-input" value={form.state} onChange={(e) => set("state", e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">CEP</label>
                        <input className="form-input" value={form.zip} onChange={(e) => set("zip", e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="glass-card p-6 space-y-5">
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Redes Sociais</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <label className="form-label">Instagram</label>
                        <input className="form-input" placeholder="@gridon" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">Facebook</label>
                        <input className="form-input" placeholder="URL" value={form.facebook} onChange={(e) => set("facebook", e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">LinkedIn</label>
                        <input className="form-input" placeholder="URL" value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="glass-card p-6 space-y-5">
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Apresentação da Empresa</h3>
                <div>
                    <label className="form-label">Vídeo Institucional</label>
                    <p className="text-xs text-white/40 mb-3">Máximo 1 minuto e 45MB. Ele substituirá automaticamente o vídeo atual.</p>
                    
                    {form.institutional_video_url ? (
                        <div className="relative rounded-lg overflow-hidden border border-white/10 group bg-black/40">
                            <video className="w-full max-h-[300px] object-cover" src={form.institutional_video_url} controls={false} />
                            
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <label className="cursor-pointer glow-btn inline-flex items-center gap-2 mb-2">
                                    <UploadCloud className="w-4 h-4" /> Trocar Vídeo
                                    <input type="file" accept="video/mp4, video/webm, video/ogg" className="hidden" onChange={handleVideoUpload} disabled={uploadingVideo} />
                                </label>
                                <button type="button" onClick={() => set("institutional_video_url", "")} className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1">
                                    <X className="w-3 h-3" /> Remover Vídeo
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className={`cursor-pointer w-full flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg transition-colors
                            ${uploadingVideo ? 'border-primary/50 bg-primary/5 cursor-wait' : 'border-white/10 hover:border-primary/50 hover:bg-white/5'}`}>
                            {uploadingVideo ? (
                                <>
                                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                                    <span className="text-sm text-primary font-medium">Enviando vídeo... Aguarde.</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                                        <Film className="w-6 h-6 text-white/40" />
                                    </div>
                                    <span className="text-sm text-white/60 font-medium">Selecionar vídeo do dispositivo</span>
                                    <span className="text-xs text-white/30 mt-1">MP4 ou WebM (Max 45MB)</span>
                                </>
                            )}
                            <input type="file" accept="video/mp4, video/webm, video/ogg" className="hidden" onChange={handleVideoUpload} disabled={uploadingVideo} />
                        </label>
                    )}
                    {videoError && <p className="text-red-400 text-xs mt-2 font-medium">{videoError}</p>}
                </div>
            </div>

            <div className="glass-card p-6 space-y-5">
                <PortfolioManager />
            </div>
        </div>
    );
};

export default CompanyInfoPage;
