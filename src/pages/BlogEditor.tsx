import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { blogService } from "@/services/blogService";
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image'],
        ['clean']
    ],
};

const BlogEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        category: "",
        excerpt: "",
        content: "",
        image_url: "",
        author: "Equipe Gridon",
        read_time: "",
        published: false
    });

    const { data: post, isLoading: isLoadingPost } = useQuery({
        queryKey: ["blogPost", id],
        queryFn: () => blogService.getPostById(id!),
        enabled: isEditing,
    });

    useEffect(() => {
        if (post) {
            setFormData({
                title: post.title,
                slug: post.slug,
                category: post.category,
                excerpt: post.excerpt || "",
                content: post.content,
                image_url: post.image_url || "",
                author: post.author || "Equipe Gridon",
                read_time: post.read_time || "",
                published: post.published || false
            });
        }
    }, [post]);

    const mutation = useMutation({
        mutationFn: (data: typeof formData) => {
            if (isEditing) {
                return blogService.updatePost(id!, data);
            } else {
                return blogService.createPost(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
            toast({ title: "Sucesso!", description: "Post salvo com sucesso." });
            navigate("/blog");
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleContentChange = (content: string) => {
        setFormData(prev => ({ ...prev, content }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Auto-generate slug if empty
        let currentSlug = formData.slug;
        if (!currentSlug) {
            currentSlug = formData.title
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setFormData(prev => ({ ...prev, slug: currentSlug }));
        }

        mutation.mutate({ ...formData, slug: currentSlug });
    };

    if (isEditing && isLoadingPost) {
        return (
            <div className="flex justify-center flex-col items-center h-64 opacity-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p>Carregando post...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/blog')}
                        className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.04] transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="section-title">{isEditing ? 'Editar Post' : 'Novo Post'}</h2>
                        <p className="section-subtitle">Preencha as informações do artigo</p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={mutation.isPending}
                    className="glow-btn flex items-center gap-2 text-sm"
                >
                    {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Post
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6 space-y-6">
                        <div>
                            <label className="form-label">Título do Post *</label>
                            <input
                                required
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Ex: Vantagens da Energia Solar"
                                className="form-input text-lg font-medium"
                            />
                        </div>

                        <div>
                            <label className="form-label">Resumo (Excerpt)</label>
                            <textarea
                                name="excerpt"
                                value={formData.excerpt}
                                onChange={handleChange}
                                placeholder="Um breve resumo sobre o artigo para aparecer na listagem..."
                                className="form-input h-24 resize-none"
                            />
                        </div>

                        <div>
                            <label className="form-label mb-3">Conteúdo Completo *</label>
                            <div className="bg-white/[0.02] rounded-xl overflow-hidden border border-white/[0.08] text-white">
                                <ReactQuill
                                    theme="snow"
                                    modules={modules}
                                    value={formData.content}
                                    onChange={handleContentChange}
                                    className="text-white min-h-[400px]"
                                />
                            </div>
                            <style>{`
                                .quill { border: none; }
                                .ql-toolbar { 
                                    border: none !important; 
                                    border-bottom: 1px solid rgba(255,255,255,0.08) !important;
                                    background: rgba(255,255,255,0.02);
                                }
                                .ql-container { border: none !important; font-family: inherit; font-size: 16px; }
                                .ql-editor { min-height: 400px; padding: 1.5rem; }
                                .ql-editor p { margin-bottom: 1rem; color: rgba(255,255,255,0.8); }
                                .ql-editor h1, .ql-editor h2, .ql-editor h3 { color: white; margin: 1.5rem 0 1rem; }
                                .ql-stroke { stroke: rgba(255,255,255,0.6) !important; }
                                .ql-fill { fill: rgba(255,255,255,0.6) !important; }
                                .ql-picker { color: rgba(255,255,255,0.6) !important; }
                            `}</style>
                        </div>
                    </div>
                </div>

                {/* Sidebar Setup */}
                <div className="space-y-6">
                    <div className="glass-card p-6 space-y-5">
                        <h3 className="text-white font-medium border-b border-white/[0.04] pb-3 mb-4">Configurações</h3>

                        <div>
                            <label className="form-label">Status</label>
                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                                <input
                                    type="checkbox"
                                    name="published"
                                    checked={formData.published}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded border-white/[0.2] bg-transparent text-primary focus:ring-primary/20 focus:ring-offset-0"
                                />
                                <div>
                                    <span className="text-sm font-medium text-white/90">Publicar agora</span>
                                    <p className="text-xs text-white/40 mt-0.5">O post ficará visível no site</p>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label className="form-label">URL (Slug)</label>
                            <input
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                placeholder="deixe-vazio-para-gerar-auto"
                                className="form-input text-sm text-white/60"
                            />
                        </div>

                        <div>
                            <label className="form-label">Categoria *</label>
                            <input
                                required
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="Ex: Dicas"
                                className="form-input"
                            />
                        </div>

                        <div>
                            <label className="form-label">Tempo de Leitura</label>
                            <input
                                name="read_time"
                                value={formData.read_time}
                                onChange={handleChange}
                                placeholder="Ex: 5 min"
                                className="form-input"
                            />
                        </div>

                        <div>
                            <label className="form-label">Autor</label>
                            <input
                                name="author"
                                value={formData.author}
                                onChange={handleChange}
                                placeholder="Equipe Gridon"
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="glass-card p-6 space-y-4">
                        <h3 className="text-white font-medium border-b border-white/[0.04] pb-3 mb-4">Imagem de Capa</h3>

                        {formData.image_url ? (
                            <div className="relative group rounded-xl overflow-hidden border border-white/[0.08]">
                                <img src={formData.image_url} alt="Capa" className="w-full h-40 object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                                        className="text-white text-sm hover:underline"
                                    >
                                        Remover
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-40 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01] flex flex-col items-center justify-center text-white/30 gap-3">
                                <ImageIcon className="w-8 h-8 opacity-50" />
                                <span className="text-sm">Nenhuma imagem</span>
                            </div>
                        )}

                        <div>
                            <label className="form-label text-xs">URL da Imagem</label>
                            <input
                                name="image_url"
                                value={formData.image_url}
                                onChange={handleChange}
                                placeholder="https://exemplo.com/imagem.jpg"
                                className="form-input text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogEditor;
