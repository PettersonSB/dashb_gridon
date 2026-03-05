import { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle } from "lucide-react";
import { useSupabaseQuery, bulkUpsert } from "@/hooks/useSupabase";

interface StatItem {
    id: string;
    value: number;
    suffix: string;
    label: string;
    sort_order: number;
}

const StatsEditor = () => {
    const { data: dbStats, loading } = useSupabaseQuery<StatItem>("stats");
    const [items, setItems] = useState<StatItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (dbStats.length > 0) setItems(dbStats);
    }, [dbStats]);

    const updateItem = (id: string, field: string, value: any) => {
        setItems(items.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        const { error } = await bulkUpsert("stats", items);
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
                    <h2 className="section-title">Métricas</h2>
                    <p className="section-subtitle">Números em destaque na seção Autoridade</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="glow-btn flex items-center gap-2 text-sm disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
                </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                {items.map((item) => (
                    <div key={item.id} className="glass-card p-5 space-y-3">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="form-label text-xs">Valor</label>
                                <input type="number" className="form-input text-2xl font-display font-bold" value={item.value} onChange={(e) => updateItem(item.id, "value", Number(e.target.value))} />
                            </div>
                            <div className="w-24">
                                <label className="form-label text-xs">Sufixo</label>
                                <input className="form-input" value={item.suffix} onChange={(e) => updateItem(item.id, "suffix", e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="form-label text-xs">Label</label>
                            <input className="form-input" value={item.label} onChange={(e) => updateItem(item.id, "label", e.target.value)} />
                        </div>
                        <div className="text-center pt-3 border-t border-white/[0.04]">
                            <span className="font-display text-2xl font-bold text-white">{item.value}{item.suffix}</span>
                            <p className="text-xs text-white/30 mt-1">{item.label}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatsEditor;
