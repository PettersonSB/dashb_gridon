import { useState } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { confirmAction } from '@/components/ui/ConfirmDialog';
import { blogService } from "@/services/blogService";
import { useToast } from "@/hooks/use-toast";

const BlogManager = () => {
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: posts = [], isLoading, error } = useQuery({
        queryKey: ["blogPosts"],
        queryFn: blogService.getPosts
    });

    const togglePublishMutation = useMutation({
        mutationFn: ({ id, published }: { id: string, published: boolean }) =>
            blogService.togglePublish(id, published),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
            toast({ title: "Sucesso!", description: "Status alterado com sucesso." });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: blogService.deletePost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
            toast({ title: "Post excluído", description: "O post foi removido com sucesso." });
        }
    });

    const filtered = posts.filter(
        (p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
    );

    const togglePublish = (id: string, currentStatus: boolean) => {
        togglePublishMutation.mutate({ id, published: currentStatus });
    };

    const removePost = async (id: string) => {
        if (await confirmAction({ title: "Excluir Post", message: "Tem certeza que deseja excluir este post? Essa ação não pode ser desfeita.", variant: "danger" })) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="section-title">Blog</h2>
                    <p className="section-subtitle">{posts.length} artigos publicados</p>
                </div>
                <Link to="/blog/new" className="glow-btn flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4" />
                    Novo Post
                </Link>
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
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="table-cell text-center py-8">Carregando posts...</td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={5} className="table-cell text-center py-8 text-red-400">Erro ao carregar os posts</td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="table-cell text-center py-8">Nenhum post encontrado</td>
                            </tr>
                        ) : (
                            filtered.map((post) => (
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
                                    <td className="table-cell text-white/30">
                                        {post.updated_at ? new Date(post.updated_at).toLocaleDateString("pt-BR") : "—"}
                                    </td>
                                    <td className="table-cell text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                to={`/blog/edit/${post.id}`}
                                                className="p-2 rounded-lg text-white/30 hover:text-primary hover:bg-primary/10 transition-all"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => togglePublish(post.id, post.published || false)}
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
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BlogManager;
