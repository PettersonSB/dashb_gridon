import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, Save, Loader2, CheckCircle } from "lucide-react";
import { useSupabaseQuery, bulkUpsert, insertRow, deleteRow } from "@/hooks/useSupabase";

interface ProblemItem {
    id: string;
    title: string;
    description: string;
    icon: string;
    color_from: string;
    color_to: string;
    sort_order: number;
}

const ProblemsEditor = () => {
    const { data: dbItems, loading, refetch } = useSupabaseQuery<ProblemItem>("problem_cards");
    const [items, setItems] = useState<ProblemItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (dbItems.length > 0) setItems(dbItems);
    }, [dbItems]);

    const updateItem = (id: string, field: string, value: string) => {
        setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    };

    const addItem = async () => {
        const { data } = await insertRow("problem_cards", {
            title: "Novo problema",
            description: "Descrição do problema",
            icon: "AlertTriangle",
            color_from: "from-red-500/20",
            color_to: "to-orange-500/20",
            sort_order: items.length,
        });
        if (data) refetch();
    };

    const removeItem = async (id: string) => {
        if (confirm("Excluir este card?")) {
            await deleteRow("problem_cards", id);
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        const { error } = await bulkUpsert("problem_cards", items);
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
                    <h2 className="section-title">Seção Problemas</h2>
                    <p className="section-subtitle">Cards da seção "O Problema" do site</p>
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
                    <div key={item.id} className="glass-card p-5 flex gap-4">
                        <div className="flex items-center text-white/20 cursor-grab">
                            <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-3">
                            <input className="form-input font-semibold" value={item.title} onChange={(e) => updateItem(item.id, "title", e.target.value)} placeholder="Título" />
                            <textarea className="form-textarea !min-h-[80px]" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Descrição" />
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="form-label text-xs">Ícone (Lucide)</label>
                                    <input className="form-input text-xs" value={item.icon} onChange={(e) => updateItem(item.id, "icon", e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label text-xs">Cor (from)</label>
                                    <input className="form-input text-xs" value={item.color_from} onChange={(e) => updateItem(item.id, "color_from", e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label text-xs">Cor (to)</label>
                                    <input className="form-input text-xs" value={item.color_to} onChange={(e) => updateItem(item.id, "color_to", e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-red-400/50 hover:text-red-400 transition-colors self-start p-2">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProblemsEditor;
