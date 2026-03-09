import { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle } from "lucide-react";
import { useSupabaseSingle, upsertRow } from "@/hooks/useSupabase";
import type { CompanyInfo as CompanyInfoType } from "@/lib/types";

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
                    <label className="form-label">Link do Vídeo Institucional (YouTube)</label>
                    <input className="form-input" placeholder="https://www.youtube.com/watch?v=..." value={form.institutional_video_url} onChange={(e) => set("institutional_video_url", e.target.value)} />
                    <p className="text-xs text-white/40 mt-1">Este vídeo aparecerá automaticamente nas propostas de orçamento.</p>
                </div>
            </div>
        </div>
    );
};

export default CompanyInfoPage;
