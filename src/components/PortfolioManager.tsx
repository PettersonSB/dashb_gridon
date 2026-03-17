import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { portfolioService, PortfolioItem } from '@/services/portfolioService';
import { useToast } from '@/hooks/use-toast';
import { confirmAction } from '@/components/ui/ConfirmDialog';

export const PortfolioManager = () => {
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [location, setLocation] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const { toast } = useToast();

    // Fetch initial data
    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            setLoading(true);
            const data = await portfolioService.getItems();
            setItems(data);
        } catch (err) {
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar o portfólio.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!imageFile) {
            toast({
                title: 'Imagem obrigatória',
                description: 'Por favor, selecione uma foto do serviço.',
                variant: 'destructive',
            });
            return;
        }

        if (!location.trim()) {
            toast({
                title: 'Localização obrigatória',
                description: 'Por favor, informe onde o serviço foi realizado.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setUploading(true);

            // 1. Upload the image to storage
            const imageUrl = await portfolioService.uploadImage(imageFile);

            // 2. Save the metadata to the database
            const newItem = await portfolioService.addItem({
                image_url: imageUrl,
                location: location.trim()
            });

            // 3. Update local state
            setItems([newItem, ...items]);

            // Reset form
            setLocation('');
            setImageFile(null);

            // Fix file input value reset by not using ref or just letting React handle standard state sync.
            const fileInput = document.getElementById('portfolio-file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            toast({
                title: 'Sucesso',
                description: 'Serviço adicionado ao portfólio!',
            });

        } catch (err: any) {
            toast({
                title: 'Erro no Upload',
                description: err.message || 'Houve um problema ao salvar o item.',
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        // Confirmation dialog
        if (!await confirmAction({ title: "Excluir Foto", message: "Certeza que deseja excluir esta foto do portfólio?", variant: "danger" })) {
            return;
        }

        try {
            await portfolioService.deleteItem(id);
            setItems(items.filter(item => item.id !== id));
            toast({
                title: 'Removido',
                description: 'Item removido do portfólio.',
            });
        } catch (err) {
            toast({
                title: 'Erro',
                description: 'Não foi possível remover o item.',
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="animate-spin text-primary w-6 h-6" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Adicionar Novo Serviço Realizado</h3>

            <form onSubmit={handleUpload} className="grid sm:grid-cols-12 gap-4 items-end bg-card/40 p-5 rounded-xl border border-white/5">
                <div className="sm:col-span-4">
                    <label className="form-label">Foto do Serviço</label>
                    <div className="relative">
                        <input
                            id="portfolio-file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <label
                            htmlFor="portfolio-file-upload"
                            className="flex items-center gap-2 cursor-pointer w-full bg-background border border-border px-3 py-2 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                        >
                            <ImageIcon className="w-4 h-4 text-primary" />
                            <span className="truncate flex-1">
                                {imageFile ? imageFile.name : "Escolher Imagem..."}
                            </span>
                        </label>
                    </div>
                </div>

                <div className="sm:col-span-6">
                    <label className="form-label">Localização ou Título (Ex: Residência - Lago Sul)</label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="form-input"
                        placeholder="Onde o serviço foi feito?"
                    />
                </div>

                <div className="sm:col-span-2">
                    <button
                        type="submit"
                        disabled={uploading}
                        className="glow-btn flex items-center justify-center gap-2 w-full h-[40px] disabled:opacity-50"
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Adicionar
                            </>
                        )}
                    </button>
                </div>
            </form>

            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mt-8">Portfólio Existente</h3>

            {items.length === 0 ? (
                <div className="text-center py-10 bg-card/20 rounded-xl border border-white/5">
                    <p className="text-muted-foreground text-sm">Nenhum serviço cadastrado no portfólio ainda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="group relative rounded-xl overflow-hidden glass-card border-white/5 aspect-square bg-muted/20">
                            <img
                                src={item.image_url}
                                alt={item.location}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 transition-opacity">
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <p className="text-white text-xs font-semibold leading-tight line-clamp-2">
                                        {item.location}
                                    </p>
                                </div>
                            </div>

                            {/* Delete Button */}
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="absolute top-2 right-2 w-8 h-8 flex justify-center items-center bg-destructive/80 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive transition-all"
                                title="Remover Imagem"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
