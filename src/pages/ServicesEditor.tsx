import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, Save, Check, X, Loader2, CheckCircle } from "lucide-react";
import { useSupabaseQuery, bulkUpsert, insertRow, deleteRow } from "@/hooks/useSupabase";
import { confirmAction } from "@/components/ui/ConfirmDialog";

interface ServiceItem {
    id: string;
    title: string;
    description: string;
    icon: string;
    features: string[];
    sort_order: number;
    active: boolean;
}

const ServicesEditor = () => {
    const { data: dbItems, loading, refetch } = useSupabaseQuery<ServiceItem>("services");
    const [items, setItems] = useState<ServiceItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (dbItems.length > 0) setItems(dbItems);
    }, [dbItems]);

    const updateItem = (id: string, field: string, value: any) => {
        setItems(items.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    };

    const addItem = async () => {
        const { data } = await insertRow("services", {
            title: "Novo Serviço",
            description: "Descrição do serviço",
            icon: "Star",
            features: ["Feature 1"],
            sort_order: items.length,
            active: true,
        });
        if (data) refetch();
    };

    const removeItem = async (id: string) => {
        if (await confirmAction({ title: "Excluir Serviço", message: "Tem certeza que deseja excluir este serviço?", variant: "danger" })) {
            await deleteRow("services", id);
            setItems(items.filter((s) => s.id !== id));
        }
    };

    const updateFeature = (serviceId: string, index: number, value: string) => {
        setItems(items.map((s) => {
            if (s.id !== serviceId) return s;
            const f = [...s.features];
            f[index] = value;
            return { ...s, features: f };
        }));
    };

    const addFeature = (serviceId: string) => {
        setItems(items.map((s) => s.id === serviceId ? { ...s, features: [...s.features, "Nova feature"] } : s));
    };

    const removeFeature = (serviceId: string, index: number) => {
        setItems(items.map((s) => {
            if (s.id !== serviceId) return s;
            return { ...s, features: s.features.filter((_, i) => i !== index) };
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        const { error } = await bulkUpsert("services", items);
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
        <div className="animate-fade-in space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="section-title">Soluções / Serviços</h2>
                    <p className="section-subtitle">Cards da seção "A Solução GRIDON"</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={addItem} className="btn-ghost flex items-center gap-2 text-sm border border-white/[0.08]">
                        <Plus className="w-4 h-4" /> Adicionar
                    </button>
                    <button onClick={handleSave} disabled={saving} className="glow-btn flex items-center gap-2 text-sm disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {items.map((item) => (
                    <div key={item.id} className={`glass-card p-5 flex gap-4 ${!item.active ? "opacity-50" : ""}`}>
                        <div className="flex items-center text-white/20 cursor-grab">
                            <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                                <input className="form-input font-semibold flex-1" value={item.title} onChange={(e) => updateItem(item.id, "title", e.target.value)} />
                                <button
                                    onClick={() => updateItem(item.id, "active", !item.active)}
                                    className={`p-2 rounded-lg transition-colors ${item.active ? "text-emerald-400 bg-emerald-500/10" : "text-white/30 bg-white/[0.04]"}`}
                                >
                                    {item.active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                </button>
                            </div>
                            <textarea className="form-textarea !min-h-[60px]" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} />
                            <div className="flex gap-3 items-end">
                                <div className="w-40">
                                    <label className="form-label text-xs">Ícone</label>
                                    <input className="form-input text-xs" value={item.icon} onChange={(e) => updateItem(item.id, "icon", e.target.value)} />
                                </div>
                                <div className="flex-1">
                                    <label className="form-label text-xs">Features</label>
                                    <div className="flex flex-wrap gap-2">
                                        {item.features.map((f, fi) => (
                                            <div key={fi} className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1">
                                                <input className="bg-transparent text-xs text-white/60 w-32 focus:outline-none" value={f} onChange={(e) => updateFeature(item.id, fi, e.target.value)} />
                                                <button onClick={() => removeFeature(item.id, fi)} className="text-white/20 hover:text-red-400">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        <button onClick={() => addFeature(item.id)} className="text-xs text-primary/60 hover:text-primary px-2 py-1">
                                            + feature
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-red-400/50 hover:text-red-400 self-start p-2">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServicesEditor;
