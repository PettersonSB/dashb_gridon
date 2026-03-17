import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Check, X, Loader2, CheckCircle } from "lucide-react";
import { useSupabaseQuery, bulkUpsert, insertRow, deleteRow } from "@/hooks/useSupabase";
import { confirmAction } from "@/components/ui/ConfirmDialog";

interface TestimonialItem {
    id: string;
    text: string;
    author: string;
    role: string;
    active: boolean;
    sort_order: number;
}

const TestimonialsEditor = () => {
    const { data: dbItems, loading, refetch } = useSupabaseQuery<TestimonialItem>("testimonials");
    const [items, setItems] = useState<TestimonialItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (dbItems.length > 0) setItems(dbItems);
    }, [dbItems]);

    const update = (id: string, field: string, value: any) => {
        setItems(items.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
    };

    const add = async () => {
        const { data } = await insertRow("testimonials", {
            text: "Novo depoimento...",
            author: "Nome",
            role: "Tipo",
            active: false,
            sort_order: items.length,
        });
        if (data) refetch();
    };

    const remove = async (id: string) => {
        if (await confirmAction({ title: "Excluir Depoimento", message: "Tem certeza que deseja excluir este depoimento?", variant: "danger" })) {
            await deleteRow("testimonials", id);
            setItems(items.filter((t) => t.id !== id));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        const { error } = await bulkUpsert("testimonials", items);
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
                    <h2 className="section-title">Depoimentos</h2>
                    <p className="section-subtitle">Carrossel de depoimentos do site</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={add} className="btn-ghost flex items-center gap-2 text-sm border border-white/[0.08]">
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
                    <div key={item.id} className={`glass-card p-5 space-y-3 ${!item.active ? "opacity-50" : ""}`}>
                        <div className="flex items-start justify-between gap-3">
                            <textarea
                                className="form-textarea !min-h-[80px] flex-1"
                                value={item.text}
                                onChange={(e) => update(item.id, "text", e.target.value)}
                                placeholder="Texto do depoimento"
                            />
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => update(item.id, "active", !item.active)}
                                    className={`p-2 rounded-lg transition-colors ${item.active ? "text-emerald-400 bg-emerald-500/10" : "text-white/30 bg-white/[0.04]"}`}
                                    title={item.active ? "Ativo" : "Inativo"}
                                >
                                    {item.active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                </button>
                                <button onClick={() => remove(item.id)} className="p-2 text-red-400/50 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="form-label text-xs">Autor</label>
                                <input className="form-input" value={item.author} onChange={(e) => update(item.id, "author", e.target.value)} />
                            </div>
                            <div>
                                <label className="form-label text-xs">Tipo</label>
                                <input className="form-input" value={item.role} onChange={(e) => update(item.id, "role", e.target.value)} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TestimonialsEditor;
