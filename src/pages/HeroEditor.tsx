import { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle } from "lucide-react";
import { useSupabaseSingle, upsertRow } from "@/hooks/useSupabase";
import type { HeroContent } from "@/lib/types";

const HeroEditor = () => {
    const { data: hero, loading } = useSupabaseSingle<HeroContent>("hero_content");
    const [form, setForm] = useState({
        badge_text: "",
        headline: "",
        subheadline: "",
        cta_text: "",
        cta_link: "",
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Populate form when data loads
    useEffect(() => {
        if (hero) {
            setForm({
                badge_text: hero.badge_text || "",
                headline: hero.headline || "",
                subheadline: hero.subheadline || "",
                cta_text: hero.cta_text || "",
                cta_link: hero.cta_link || "",
            });
        }
    }, [hero]);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        const { error } = await upsertRow("hero_content", {
            ...(hero?.id ? { id: hero.id } : {}),
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
        <div className="animate-fade-in space-y-8 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="section-title">Hero Section</h2>
                    <p className="section-subtitle">Edite o conteúdo principal do topo do site</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="glow-btn flex items-center gap-2 text-sm disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
                </button>
            </div>

            <div className="glass-card p-6 space-y-5">
                <div>
                    <label className="form-label">Badge (texto superior)</label>
                    <input className="form-input" value={form.badge_text} onChange={(e) => setForm({ ...form, badge_text: e.target.value })} />
                </div>
                <div>
                    <label className="form-label">Headline</label>
                    <input className="form-input text-lg font-display" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
                </div>
                <div>
                    <label className="form-label">Subheadline</label>
                    <textarea className="form-textarea" value={form.subheadline} onChange={(e) => setForm({ ...form, subheadline: e.target.value })} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="form-label">Texto do CTA</label>
                        <input className="form-input" value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} />
                    </div>
                    <div>
                        <label className="form-label">Link do CTA</label>
                        <input className="form-input" value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} />
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div>
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Preview</h3>
                <div className="glass-card p-8 text-center space-y-4 bg-gradient-to-b from-card to-background">
                    <div className="inline-flex items-center gap-2 glass-card px-3 py-1.5 text-xs text-white/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {form.badge_text}
                    </div>
                    <h2 className="font-display text-3xl font-bold text-white">{form.headline}</h2>
                    <p className="text-white/40 max-w-md mx-auto text-sm">{form.subheadline}</p>
                    <button className="glow-btn text-sm">{form.cta_text} →</button>
                </div>
            </div>
        </div>
    );
};

export default HeroEditor;
