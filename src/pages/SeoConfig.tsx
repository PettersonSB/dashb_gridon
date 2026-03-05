import { useState } from "react";
import { Save, Globe } from "lucide-react";

const defaultSeo = [
    { id: "1", page: "home", title: "Gridon Energia Solar", description: "A Gridon Energia Solar oferece soluções completas em energia fotovoltaica para residências e empresas em Brasília. Economize até 95% na conta de luz.", keywords: "energia solar, painéis solares, fotovoltaica, Brasília, DF", og_image: "" },
    { id: "2", page: "blog", title: "Blog — Gridon Energia Solar", description: "Artigos, guias e novidades sobre energia fotovoltaica, economia e sustentabilidade.", keywords: "blog energia solar, artigos fotovoltaica, dicas economia energia", og_image: "" },
];

const SeoConfig = () => {
    const [pages, setPages] = useState(defaultSeo);

    const update = (id: string, field: string, value: string) => {
        setPages(pages.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    };

    return (
        <div className="animate-fade-in space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="section-title">Configurações SEO</h2>
                    <p className="section-subtitle">Meta tags e Open Graph por página</p>
                </div>
                <button className="glow-btn flex items-center gap-2 text-sm">
                    <Save className="w-4 h-4" /> Salvar
                </button>
            </div>

            {pages.map((page) => (
                <div key={page.id} className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Globe className="w-5 h-5 text-primary" />
                        <h3 className="font-display font-semibold text-white capitalize">{page.page}</h3>
                        <span className="text-xs text-white/20">/{page.page === "home" ? "" : page.page}</span>
                    </div>

                    <div>
                        <label className="form-label">Title Tag</label>
                        <input className="form-input" value={page.title} onChange={(e) => update(page.id, "title", e.target.value)} />
                        <p className="text-xs text-white/20 mt-1">{page.title.length}/60 caracteres</p>
                    </div>
                    <div>
                        <label className="form-label">Meta Description</label>
                        <textarea className="form-textarea !min-h-[80px]" value={page.description} onChange={(e) => update(page.id, "description", e.target.value)} />
                        <p className="text-xs text-white/20 mt-1">{page.description.length}/160 caracteres</p>
                    </div>
                    <div>
                        <label className="form-label">Keywords</label>
                        <input className="form-input" value={page.keywords} onChange={(e) => update(page.id, "keywords", e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">OG Image URL</label>
                        <input className="form-input" placeholder="https://..." value={page.og_image} onChange={(e) => update(page.id, "og_image", e.target.value)} />
                    </div>

                    {/* Preview */}
                    <div className="border-t border-white/[0.04] pt-4">
                        <p className="text-xs text-white/30 mb-2">Preview no Google:</p>
                        <div className="bg-white/[0.02] rounded-xl p-4 space-y-1">
                            <p className="text-sm text-primary truncate">{page.title || "Título da página"}</p>
                            <p className="text-xs text-emerald-400">gridonsolar.com.br{page.page === "home" ? "" : `/${page.page}`}</p>
                            <p className="text-xs text-white/40 line-clamp-2">{page.description || "Descrição da página..."}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SeoConfig;
