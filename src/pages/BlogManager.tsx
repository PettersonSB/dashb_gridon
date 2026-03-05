import { useState } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, Search } from "lucide-react";

interface Post {
    id: string;
    title: string;
    slug: string;
    category: string;
    published: boolean;
    updated_at: string;
}

const defaultPosts: Post[] = [
    { id: "1", title: "Como Funciona a Energia Solar Fotovoltaica?", slug: "como-funciona-energia-solar-fotovoltaica", category: "Educativo", published: true, updated_at: "2026-02-28" },
    { id: "2", title: "7 Vantagens da Energia Solar Residencial em Brasília", slug: "vantagens-energia-solar-residencial-brasilia", category: "Dicas", published: true, updated_at: "2026-02-20" },
    { id: "3", title: "Quanto Custa Instalar Energia Solar em 2026?", slug: "quanto-custa-instalar-energia-solar", category: "Investimento", published: true, updated_at: "2026-02-15" },
    { id: "4", title: "Manutenção de Painéis Solares: Guia Completo", slug: "manutencao-paineis-solares-guia-completo", category: "Manutenção", published: true, updated_at: "2026-02-10" },
    { id: "5", title: "Carregador de Veículo Elétrico + Energia Solar", slug: "carregador-veiculo-eletrico-energia-solar", category: "Inovação", published: true, updated_at: "2026-02-05" },
    { id: "6", title: "Energia Solar para Empresas: Como Reduzir Custos", slug: "energia-solar-para-empresas-reducao-custos", category: "Empresarial", published: true, updated_at: "2026-01-28" },
];

const BlogManager = () => {
    const [posts, setPosts] = useState(defaultPosts);
    const [search, setSearch] = useState("");

    const filtered = posts.filter(
        (p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
    );

    const togglePublish = (id: string) => {
        setPosts(posts.map((p) => (p.id === id ? { ...p, published: !p.published } : p)));
    };

    const removePost = (id: string) => {
        if (confirm("Tem certeza que deseja excluir este post?")) {
            setPosts(posts.filter((p) => p.id !== id));
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="section-title">Blog</h2>
                    <p className="section-subtitle">{posts.length} artigos publicados</p>
                </div>
                <button className="glow-btn flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4" />
                    Novo Post
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                    className="form-input pl-11"
                    placeholder="Buscar por título ou categoria..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="table-header">Título</th>
                            <th className="table-header">Categoria</th>
                            <th className="table-header">Status</th>
                            <th className="table-header">Atualizado</th>
                            <th className="table-header text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((post) => (
                            <tr key={post.id} className="group hover:bg-white/[0.02]">
                                <td className="table-cell">
                                    <span className="text-white/80 font-medium">{post.title}</span>
                                    <p className="text-xs text-white/25 mt-0.5">/{post.slug}</p>
                                </td>
                                <td className="table-cell">
                                    <span className="badge-primary">{post.category}</span>
                                </td>
                                <td className="table-cell">
                                    {post.published ? (
                                        <span className="badge-success">Publicado</span>
                                    ) : (
                                        <span className="badge-warning">Rascunho</span>
                                    )}
                                </td>
                                <td className="table-cell text-white/30">{post.updated_at}</td>
                                <td className="table-cell text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button className="p-2 rounded-lg text-white/30 hover:text-primary hover:bg-primary/10 transition-all">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => togglePublish(post.id)}
                                            className={`p-2 rounded-lg transition-all ${post.published ? "text-emerald-400/50 hover:text-emerald-400" : "text-white/30 hover:text-amber-400"}`}
                                        >
                                            {post.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => removePost(post.id)}
                                            className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BlogManager;
