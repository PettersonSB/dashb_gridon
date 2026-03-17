import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import AddProductModal from '@/components/AddProductModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kitService } from '@/services/kitService';
import { emitToast } from '@/components/ui/Toaster';
import { confirmAction } from '@/components/ui/ConfirmDialog';

export default function ProductList() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['solarProducts'],
        queryFn: kitService.getProducts
    });
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    const deleteMutation = useMutation({
        mutationFn: kitService.deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['solarProducts'] });
            emitToast({ title: "Produto excluído", description: "O produto foi removido com sucesso." });
        },
        onError: () => {
            emitToast({ title: "Erro", description: "Falha ao excluir produto.", variant: "destructive" });
        }
    });

    const filteredProducts = useMemo(() =>
        products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.brand?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase())
        ), [products, searchTerm]);

    const handleAddProduct = () => {
        setIsProductModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['solarProducts'] });
    };

    const handleDelete = async (id: string) => {
        if(await confirmAction({ title: "Excluir Produto", message: "Tem certeza que deseja excluir esse produto?", variant: "danger" })) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Procurar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input !pl-10 !py-2.5"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setIsProductModalOpen(true)}
                    className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
                >
                    <Plus className="w-5 h-5" /> Adicionar Produto
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Produto</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Categoria</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Preço</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Marca/Modelo</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-center">Potência</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-center">Tensão (V)</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-center">Garantia</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-white/40">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>Carregando produtos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-white/40">
                                        Nenhum produto encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 cursor-zoom-in group-hover:border-primary/50 transition-all overflow-hidden"
                                                    onClick={() => product.image_url && setSelectedImageUrl(product.image_url)}
                                                >
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-5 h-5 text-orange-400 opacity-50" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                                                    <p className="text-xs text-white/40 truncate mt-0.5 max-w-[200px]">{product.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/70 border border-white/10 uppercase tracking-tight">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-emerald-400">
                                                {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <p className="text-white/90">{product.brand?.name || '-'}</p>
                                                <p className="text-xs text-white/40">{product.model || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm text-white/70 font-display">{product.power} W</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm text-white/70">{product.voltage || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm text-white/70 font-medium">{product.warranty ? `${product.warranty} anos` : '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button type="button" className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
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

            <AddProductModal 
                isOpen={isProductModalOpen} 
                onClose={() => setIsProductModalOpen(false)} 
                onAddProduct={handleAddProduct}
            />

            {/* Lightbox / Preview */}
            {selectedImageUrl && (
                <div 
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in cursor-zoom-out"
                    onClick={() => setSelectedImageUrl(null)}
                >
                    <div className="max-w-4xl max-h-[90vh] relative animate-scale-in">
                        <button 
                            className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white transition-colors"
                            onClick={() => setSelectedImageUrl(null)}
                        >
                            <Plus className="w-8 h-8 rotate-45" />
                        </button>
                        <img 
                            src={selectedImageUrl} 
                            alt="Preview" 
                            className="rounded-2xl shadow-2xl border border-white/10 max-w-full max-h-[85vh] object-contain" 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
