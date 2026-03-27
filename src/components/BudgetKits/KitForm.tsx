import React, { useState, useEffect, useMemo } from 'react';
import { emitToast } from '@/components/ui/Toaster';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { kitService } from '@/services/kitService';
import { SolarKit, SolarKitItem, SolarProduct } from '@/lib/types';
import { Save, Image as ImageIcon, CheckCircle2, Search, Plus, Trash2, Calculator, Loader2 } from 'lucide-react';
    // Removed ReactQuill imports

const SYSTEM_TYPES = ['On Grid', 'Off Grid', 'Híbrido', 'Backup Box'] as const;

interface KitFormProps {
    initialKit: SolarKit | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function KitForm({ initialKit, onSuccess, onCancel }: KitFormProps) {
    const queryClient = useQueryClient();

    // Data fetching (Products database)
    const { data: products = [] } = useQuery({
        queryKey: ['solarProducts'],
        queryFn: kitService.getProducts,
    });

    // --- Form State ---
    const [name, setName] = useState('');
    const [systemType, setSystemType] = useState<SolarKit['system_type']>('On Grid');
    
    // Kit Items
    const [items, setItems] = useState<(SolarKitItem & { product: SolarProduct })[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    
    // Calculated & Manual fields
    const [isPriceAuto, setIsPriceAuto] = useState(true);
    const [kitPrice, setKitPrice] = useState('');
    const [systemPower, setSystemPower] = useState('');
    const [estimatedGeneration, setEstimatedGeneration] = useState('');

    // Presentation (Removed image and description state)

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');



    const resetForm = () => {
        setName('');
        setSystemType('On Grid');
        setItems([]);
        setIsPriceAuto(true);
        setKitPrice('');
        setSystemPower('');
        setEstimatedGeneration('');

        setSelectedProductId('');
        setSelectedCategory('');
    };

    // Load initial data
    useEffect(() => {
        if (initialKit) {
            setName(initialKit.name || '');
            setSystemType(initialKit.system_type);
            setIsPriceAuto(initialKit.is_price_auto ?? true);
            setKitPrice(initialKit.kit_price ? initialKit.kit_price.toString() : '');
            setSystemPower(initialKit.system_power ? initialKit.system_power.toString() : '');
            setEstimatedGeneration(initialKit.estimated_generation ? initialKit.estimated_generation.toString() : '');

            
            // Transform relations into our state format
            if (initialKit.items && initialKit.items.length > 0) {
                const mappedItems = initialKit.items.map(item => ({
                    ...item,
                    product: item.product!
                }));
                setItems(mappedItems);
            }
        } else {
            resetForm();
        }
    }, [initialKit]);

    // --- Reactive Calculations ---
    useEffect(() => {
        if (items.length === 0) return; // Don't auto-clear on empty unless desired

        // 1. Auto Price
        if (isPriceAuto) {
            const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
            setKitPrice(totalPrice.toFixed(2));
        }

        // 2. Auto System Power (Sum of all modules/panels power). Assumes category 'Placa' or 'Módulos'.
        // If the array has no panel, fallback to sum of all items power, but usually panels dictate it.
        const panelItems = items.filter(i => i.product.category.toLowerCase().includes('módulo') || i.product.category.toLowerCase().includes('placa'));
        const itemsToSum = panelItems.length > 0 ? panelItems : items;
        
        let totalPowerW = itemsToSum.reduce((sum, item) => sum + (item.product.power * item.quantity), 0);
        // Potência pico (Kwp)
        const kwp = (totalPowerW / 1000).toFixed(2);
        if (parseFloat(kwp) > 0) {
            setSystemPower(kwp);
            
            // 3. Auto Estimated Generation (Kwp * 120 approx average in BR)
            const estimatedKwh = (parseFloat(kwp) * 120).toFixed(0);
            setEstimatedGeneration(estimatedKwh);
        }
    }, [items, isPriceAuto]);

    // --- Handlers ---
    const handleAddItem = () => {
        if (!selectedProductId) return;
        
        const existingItem = items.find(i => i.product_id === selectedProductId);
        if (existingItem) {
            // Increment qty
            setItems(items.map(i => i.product_id === selectedProductId ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            // Add new
            const product = products.find(p => p.id === selectedProductId);
            if (product) {
                setItems([...items, {
                    id: Math.random().toString(), // temp ID
                    kit_id: initialKit?.id || '',
                    product_id: product.id,
                    quantity: 1,
                    product: product,
                    created_at: new Date().toISOString()
                }]);
            }
        }
        setSelectedProductId('');
    };

    const handleUpdateQuantity = (productId: string, qty: number) => {
        if (qty < 1) return;
        setItems(items.map(i => i.product_id === productId ? { ...i, quantity: qty } : i));
    };

    const handleRemoveItem = (productId: string) => {
        setItems(items.filter(i => i.product_id !== productId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccessMessage('');

        try {
            if (!name) throw new Error("O nome do kit é obrigatório.");
            if (items.length === 0) throw new Error("O kit deve conter pelo menos 1 produto.");

            const finalImageUrl = ''; // Removed from Kit Form

            // Parsing help: Remove currency symbols and handle comma vs dot
            const cleanNumeric = (val: string) => {
                const cleaned = val.toString().replace(/[^\d,.]/g, '').replace(',', '.');
                return parseFloat(cleaned);
            };

            const payload = {
                name,
                system_type: systemType,
                is_price_auto: isPriceAuto,
                estimated_generation: Number(estimatedGeneration) || null,
                system_power: cleanNumeric(systemPower.toString()) || 0,
                kit_price: cleanNumeric(kitPrice.toString()) || 0,
                image_url: finalImageUrl,
                description: '', // Removed from Kit Form
                
                // Legacy required fields mapping
                equipment_type: 'Inversor' as const,
                panel_power: 0,
                panels_count: 0
            };

            const itemsPayload = items.map(i => ({
                product_id: i.product_id || i.product?.id,
                quantity: i.quantity
            }));

            if (initialKit) {
                await kitService.updateKit(initialKit.id, payload, itemsPayload);
                setSuccessMessage('Kit atualizado com sucesso!');
            } else {
                await kitService.createKit(payload, itemsPayload);
                setSuccessMessage('Kit fotovoltaico montado com sucesso!');
            }

            queryClient.invalidateQueries({ queryKey: ['solarKits'] });

            setTimeout(() => {
                setSuccessMessage('');
                onSuccess();
            }, 1000);

        } catch (error: any) {
            console.error("Error saving kit:", error);
            
            // Extract the most helpful message possible
            let errorMessage = "Verifique as informações.";
            if (error instanceof Error) errorMessage = error.message;
            else if (typeof error === 'object' && error !== null && error.message) errorMessage = error.message;
            else if (typeof error === 'string') errorMessage = error;

            emitToast({ 
                title: "Erro ao salvar", 
                description: errorMessage, 
                variant: "destructive" 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {successMessage && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* HEADERS */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Nome do Kit *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Kit Residencial 5kWp On-Grid"
                            className="form-input"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Tipo do Sistema *</label>
                        <select
                            value={systemType}
                            onChange={(e) => setSystemType(e.target.value as any)}
                            className="form-input bg-slate-900"
                            required
                        >
                            {SYSTEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                <div className="border-t border-white/[0.04] my-2" />

                {/* CALCULATIONS */}
                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 space-y-6">
                    <h4 className="text-white font-medium flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-primary" /> Dimensionamento & Preços
                    </h4>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-emerald-400">Valor Total (R$) *</label>
                                <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer hover:text-white transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={isPriceAuto}
                                        onChange={(e) => setIsPriceAuto(e.target.checked)}
                                        className="form-checkbox bg-slate-900 border-white/20 text-primary focus:ring-primary rounded"
                                    />
                                    Preço Automático
                                </label>
                            </div>
                            <input
                                type="number"
                                value={kitPrice}
                                onChange={(e) => setKitPrice(e.target.value)}
                                placeholder="0.00"
                                className={`form-input focus:bg-black/40 border-emerald-500/20 text-emerald-100 ${isPriceAuto ? 'bg-black/40 opacity-70 cursor-not-allowed' : 'bg-black/20'}`}
                                min="0" step="0.01" required
                                readOnly={isPriceAuto}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-primary">Potência Pico (kWp) *</label>
                            <input
                                type="number"
                                value={systemPower}
                                onChange={(e) => setSystemPower(e.target.value)}
                                placeholder="0.00"
                                className="form-input bg-black/20 focus:bg-black/40 border-primary/20 text-white"
                                min="0" step="0.01" required
                            />
                            <p className="text-[10px] text-white/40 leading-tight block mt-1">Calculado automaticamente com base na potência Módulos/Placas.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Geração Mês (kWh) *</label>
                            <input
                                type="number"
                                value={estimatedGeneration}
                                onChange={(e) => setEstimatedGeneration(e.target.value)}
                                placeholder="0"
                                className="form-input bg-black/20 focus:bg-black/40 border-white/10"
                                min="0" required
                            />
                             <p className="text-[10px] text-white/40 leading-tight block mt-1">Estimativa sugerida: kWp x 120.</p>
                        </div>
                    </div>
                </div>

                {/* PRODUCTS LIST */}
                <div className="space-y-4">
                    <h4 className="text-white font-medium flex items-center justify-between">
                        Produtos Inclusos *
                    </h4>
                    
                    {/* Category Filter + Add Product Line */}
                    <div className="flex gap-4">
                        <select
                            className="form-input w-48 bg-slate-900 flex-shrink-0"
                            value={selectedCategory}
                            onChange={(e) => { setSelectedCategory(e.target.value); setSelectedProductId(''); }}
                        >
                            <option value="">Todas as Categorias</option>
                            {[...new Set(products.map(p => p.category))].sort().map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <select 
                            className="form-input flex-1 bg-slate-900"
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                        >
                            <option value="">-- Selecionar um Produto --</option>
                            {products
                                .filter(p => !selectedCategory || p.category === selectedCategory)
                                .map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.category} | {p.name} {p.brand?.name ? `(${p.brand.name})` : ''} {(p.power && /módulo|modulo|inversor|micro/i.test(p.category)) ? `- ${p.power}W ` : ''}- {p.price.toLocaleString('pt-BR', {style: 'currency', currency:'BRL'})}
                                </option>
                            ))}
                        </select>
                        <button 
                            type="button" 
                            disabled={!selectedProductId}
                            onClick={handleAddItem}
                            className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5"/> Adicionar
                        </button>
                    </div>

                    {/* Items Table */}
                    {items.length > 0 && (
                        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase">Produto</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase">Preço Un.</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase text-center w-32">Quantidade</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase text-right">Subtotal</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {items.map(item => (
                                        <tr key={item.product_id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {item.product.image_url ? (
                                                        <img src={item.product.image_url} alt="" className="w-8 h-8 rounded border border-white/10 object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded border border-white/10 bg-white/5 flex items-center justify-center">
                                                            <ImageIcon className="w-4 h-4 text-white/20" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-white font-medium truncate">{item.product.name}</p>
                                                        <p className="text-[10px] text-white/40">
                                                            {item.product.category}
                                                            {item.product.brand?.name ? ` • ${item.product.brand.name}` : ''}
                                                            {(item.product.power && /módulo|modulo|inversor|micro/i.test(item.product.category)) ? ` • ${item.product.power}W` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-white/70">
                                                {item.product.price.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                                                    className="form-input !py-1 text-center font-display"
                                                    min="1"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-emerald-400 font-medium text-right">
                                                {(item.product.price * item.quantity).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveItem(item.product_id)}
                                                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all font-medium"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {items.length === 0 && (
                        <div className="border border-dashed border-white/10 rounded-xl p-8 text-center bg-white/[0.01]">
                            <p className="text-white/40 text-sm">Nenhum produto adicionado ao kit ainda.</p>
                        </div>
                    )}
                </div>

                <div className="border-t border-white/[0.04] my-2" />



                <div className="pt-4 flex justify-end gap-3 sticky bottom-4">
                    {initialKit && (
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={onCancel}
                            className="bg-slate-800 hover:bg-slate-700 text-white/70 px-6 py-2.5 rounded-xl font-medium transition-colors border border-white/10 shadow-xl disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSubmitting ? 'Salvando Kit...' : (initialKit ? 'Salvar Alterações' : 'Cadastrar Kit')}
                    </button>
                </div>
            </form>
        </div>
    );
}
