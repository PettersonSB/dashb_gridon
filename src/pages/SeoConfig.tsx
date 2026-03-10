import { useState, useEffect } from "react";
import { Save, Globe, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { seoService, SeoSettings } from "@/services/seoService";

const SeoConfig = () => {
    const { toast } = useToast();
    const [pages, setPages] = useState<SeoSettings[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await seoService.getSettings();
            setPages(data);
        } catch (error) {
            toast({
                title: "Erro ao carregar",
                description: "Não foi possível carregar as configurações de SEO.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const update = (id: string, field: string, value: string) => {
        setPages(pages.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await seoService.updateSettings(pages);
            toast({
                title: "Sucesso!",
                description: "Configurações de SEO salvas com sucesso.",
            });
        } catch (error) {
            toast({
                title: "Erro ao salvar",
                description: "Ocorreu um erro ao salvar as configurações.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 md:w-12 md:h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="section-title">Configurações SEO</h2>
                    <p className="section-subtitle">Meta tags e Open Graph por página</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="glow-btn flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? "Salvando..." : "Salvar"}
                </button>
            </div>

            {pages.map((page) => (
                <div key={page.id} className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Globe className="w-5 h-5 text-primary" />
                        <h3 className="font-display font-semibold text-white capitalize">{page.page_name}</h3>
                        <span className="text-xs text-white/20">/{page.page_name === "home" ? "" : page.page_name}</span>
                    </div>

                    <div>
                        <label className="form-label">Title Tag</label>
                        <input className="form-input" value={page.title} onChange={(e) => update(page.id, "title", e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">Meta Description</label>
                        <textarea className="form-textarea !min-h-[80px]" value={page.description || ''} onChange={(e) => update(page.id, "description", e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">Keywords</label>
                        <input className="form-input" value={page.keywords || ''} onChange={(e) => update(page.id, "keywords", e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">OG Image URL</label>
                        <input className="form-input" placeholder="https://..." value={page.og_image || ''} onChange={(e) => update(page.id, "og_image", e.target.value)} />
                    </div>

                    {/* Preview */}
                    <div className="border-t border-white/[0.04] pt-4">
                        <p className="text-xs text-white/30 mb-2">Preview no Google / Redes Sociais:</p>
                        <div className="bg-white/[0.02] rounded-xl p-4 space-y-3">
                            <div>
                                <p className="text-sm text-primary truncate font-medium">{page.title || "Título da página"}</p>
                                <p className="text-xs text-emerald-400 mb-0.5">gridonsolar.com.br{page.page_name === "home" ? "" : `/${page.page_name}`}</p>
                                <p className="text-xs text-white/40 line-clamp-2">{page.description || "Descrição da página aparecem aqui nos resultados de busca."}</p>
                            </div>
                            {page.og_image && (
                                <div className="mt-2 text-xs text-white/40">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-white/60">Imagem de Compartilhamento (WhatsApp/Redes):</span>
                                    </div>
                                    <img src={page.og_image} alt="OG Preview" className="max-h-32 rounded-lg border border-white/10 object-cover" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SeoConfig;
