import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { kitService } from '@/services/kitService';
import { SolarBrand, SolarKit } from '@/lib/types';
import { Plus, Save, Sun, Loader2, Image as ImageIcon, Trash2, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const SYSTEM_TYPES = ['On Grid', 'Off Grid', 'Híbrido', 'Backup Box'] as const;
const EQUIPMENT_TYPES = ['Inversor', 'Inversor Híbrido', 'Micro Inversor', 'Wallbox'] as const;

export default function BudgetKits() {
    const queryClient = useQueryClient();

    // Data fetching
    const { data: equipmentBrands = [] } = useQuery({
        queryKey: ['solarBrands', 'equipamento'],
        queryFn: () => kitService.getBrands('equipamento'),
    });

    const { data: panelBrands = [] } = useQuery({
        queryKey: ['solarBrands', 'placa'],
        queryFn: () => kitService.getBrands('placa'),
    });

    const { data: kits = [], isLoading: isLoadingKits, refetch: refetchKits } = useQuery({
        queryKey: ['solarKits'],
        queryFn: () => kitService.getKits(),
    });

    // Form State
    const [editingKitId, setEditingKitId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('list');
    const [systemType, setSystemType] = useState<SolarKit['system_type']>('On Grid');
    const [equipmentType, setEquipmentType] = useState<SolarKit['equipment_type']>('Inversor');
    const [equipmentBrandId, setEquipmentBrandId] = useState('');
    const [equipmentWarranty, setEquipmentWarranty] = useState('');
    const [estimatedGeneration, setEstimatedGeneration] = useState('');
    const [panelsCount, setPanelsCount] = useState('');
    const [panelPower, setPanelPower] = useState('');
    const [panelBrandId, setPanelBrandId] = useState('');
    const [panelWarranty, setPanelWarranty] = useState('');

    // UI state for inline creation
    const [isCreatingEqBrand, setIsCreatingEqBrand] = useState(false);
    const [newEqBrandName, setNewEqBrandName] = useState('');
    const [isCreatingPanelBrand, setIsCreatingPanelBrand] = useState(false);
    const [newPanelBrandName, setNewPanelBrandName] = useState('');

    const [systemPower, setSystemPower] = useState('');
    const [kitPrice, setKitPrice] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [description, setDescription] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ],
    };

    const resetForm = () => {
        setSystemType('On Grid');
        setEquipmentType('Inversor');
        setEquipmentBrandId('');
        setEquipmentWarranty('');
        setEstimatedGeneration('');
        setPanelsCount('');
        setPanelPower('');
        setPanelBrandId('');
        setPanelWarranty('');
        setSystemPower('');
        setKitPrice('');
        setImageFile(null);
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
        setDescription('');
        setIsCreatingEqBrand(false);
        setIsCreatingEqBrand(false);
        setIsCreatingPanelBrand(false);
        setEditingKitId(null);
    };

    const handleEditKit = (kit: SolarKit) => {
        setSystemType(kit.system_type);
        setEquipmentType(kit.equipment_type);
        setEquipmentBrandId(kit.equipment_brand_id || '');
        setEquipmentWarranty(kit.equipment_warranty ? kit.equipment_warranty.toString() : '');
        setEstimatedGeneration(kit.estimated_generation ? kit.estimated_generation.toString() : '');
        setPanelsCount(kit.panels_count.toString());
        setPanelPower(kit.panel_power.toString());
        setPanelBrandId(kit.panel_brand_id || '');
        setPanelWarranty(kit.panel_warranty ? kit.panel_warranty.toString() : '');
        setSystemPower(kit.system_power.toString());
        setKitPrice(kit.kit_price.toString());
        setImagePreviewUrl(kit.image_url || null);
        setDescription(kit.description || '');
        setEditingKitId(kit.id);
        setActiveTab('new');
    };

    const handleDeleteKit = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir este kit? Esta ação não pode ser desfeita e pode dar erro se o kit estiver atrelado a algum orçamento.")) return;

        try {
            await kitService.deleteKit(id);
            setSuccessMessage('Kit excluído com sucesso!');
            refetchKits();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error(error);
            alert("Erro ao excluir o kit. Pode ser que já exista um orçamento usando este kit.");
        }
    };

    const handleCreateBrand = async (type: 'equipamento' | 'placa', name: string) => {
        if (!name.trim()) return;
        try {
            const newBrand = await kitService.createBrand(name.trim(), type);
            // Refresh combo boxes
            queryClient.invalidateQueries({ queryKey: ['solarBrands', type] });

            if (type === 'equipamento') {
                setEquipmentBrandId(newBrand.id);
                setIsCreatingEqBrand(false);
                setNewEqBrandName('');
            } else {
                setPanelBrandId(newBrand.id);
                setIsCreatingPanelBrand(false);
                setNewPanelBrandName('');
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao criar a marca.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccessMessage('');

        try {
            // Validate image size (optional, we set 500kb as a guide in UI, let's enforce e.g. 2MB max here just in case)
            if (imageFile && imageFile.size > 2 * 1024 * 1024) {
                throw new Error("A imagem selecionada é muito grande (Máximo 2MB).");
            }

            // 1. Upload image if exists
            let finalImageUrl = '';
            if (imageFile) {
                finalImageUrl = await kitService.uploadKitImage(imageFile);
            }

            const payload = {
                system_type: systemType,
                equipment_type: equipmentType,
                equipment_brand_id: equipmentBrandId || null,
                equipment_warranty: equipmentWarranty ? Number(equipmentWarranty) : null,
                estimated_generation: equipmentType !== 'Wallbox' ? Number(estimatedGeneration) : null,
                panels_count: Number(panelsCount),
                panel_power: Number(panelPower),
                panel_brand_id: panelBrandId || null,
                panel_warranty: panelWarranty ? Number(panelWarranty) : null,
                system_power: Number(systemPower),
                kit_price: Number(kitPrice.replace(/[^\d.]/g, '')),
                image_url: finalImageUrl || (editingKitId ? imagePreviewUrl || '' : ''),
                description: description,
            };

            if (editingKitId) {
                await kitService.updateKit(editingKitId, payload);
                setSuccessMessage('Kit atualizado com sucesso!');
            } else {
                await kitService.createKit(payload);
                setSuccessMessage('Kit fotovoltaico cadastrado com sucesso!');
            }

            // Refresh queries
            queryClient.invalidateQueries({ queryKey: ['solarBrands'] });
            refetchKits();

            resetForm();
            setActiveTab('list');

            setTimeout(() => setSuccessMessage(''), 4000);

        } catch (error) {
            console.error("Error saving kit:", error);
            alert(error instanceof Error ? error.message : "Erro ao salvar o kit. Verifique as informações.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Sun className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1">
                    <h2 className="section-title !mb-0">Kit Solar</h2>
                    <p className="section-subtitle">Gerencie suas configurações de kits fotovoltaicos</p>
                </div>
            </div>

            {successMessage && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            <Tabs value={activeTab} onValueChange={(v) => {
                setActiveTab(v);
                if (v === 'new' && !editingKitId) resetForm();
            }} className="space-y-6">
                <TabsList className="bg-slate-900 border border-white/5">
                    <TabsTrigger value="list" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        Kits Cadastrados
                    </TabsTrigger>
                    <TabsTrigger value="new" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        {editingKitId ? 'Editar Kit' : 'Novo Kit'}
                    </TabsTrigger>
                </TabsList>

                {/* TAB: LIST */}
                <TabsContent value="list" className="space-y-4 outline-none">
                    {isLoadingKits ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : kits.length === 0 ? (
                        <div className="glass-card p-12 text-center flex flex-col items-center">
                            <Sun className="w-12 h-12 text-white/20 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2 font-display">Nenhum Kit Encontrado</h3>
                            <p className="text-white/40 mb-6 max-w-sm">Você ainda não possui kits cadastrados. Crie um novo kit para poder gerar orçamentos.</p>
                            <button
                                onClick={() => setActiveTab('new')}
                                className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Cadastrar Kit
                            </button>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {kits.map(kit => (
                                <div key={kit.id} className="glass-card hover:bg-white/5 transition-colors overflow-hidden flex flex-col">
                                    <div className="h-40 bg-black/40 relative border-b border-white/[0.04] p-4 flex items-center justify-center">
                                        {kit.image_url ? (
                                            <img src={kit.image_url} alt="Kit" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                        ) : (
                                            <ImageIcon className="w-10 h-10 text-white/10" />
                                        )}
                                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white border border-white/10">
                                            {kit.system_power} kWp
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex-1">
                                            <h3 className="font-display font-bold text-lg text-white mb-1 line-clamp-1">
                                                {kit.equipment_type} {kit.equipment_brand?.name}
                                            </h3>
                                            <p className="text-sm text-white/50 mb-4">
                                                {kit.panels_count}x Placas {kit.panel_power}W ({kit.panel_brand?.name})
                                            </p>
                                            <div className="flex flex-col gap-1.5 mb-6 text-sm">
                                                <div className="flex justify-between items-center text-white/70">
                                                    <span>Geração Mensal:</span>
                                                    <span className="text-emerald-400 font-medium">{kit.estimated_generation || 0} kWh</span>
                                                </div>
                                                <div className="flex justify-between items-center text-white/70">
                                                    <span>Valor do Kit:</span>
                                                    <span className="text-white font-medium text-base">
                                                        {Number(kit.kit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.04]">
                                            <button
                                                onClick={() => handleEditKit(kit)}
                                                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors text-sm font-medium border border-white/10"
                                            >
                                                <Edit2 className="w-4 h-4" /> Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteKit(kit.id)}
                                                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors text-sm font-medium border border-red-500/20"
                                            >
                                                <Trash2 className="w-4 h-4" /> Excluir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* TAB: NEW / EDIT */}
                <TabsContent value="new" className="glass-card p-6 md:p-8 outline-none">

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Linha 1: Tipos */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Tipo de Sistema</label>
                                <select
                                    value={systemType}
                                    onChange={(e) => setSystemType(e.target.value as any)}
                                    className="form-input"
                                    required
                                >
                                    {SYSTEM_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Equipamento</label>
                                <select
                                    value={equipmentType}
                                    onChange={(e) => setEquipmentType(e.target.value as any)}
                                    className="form-input"
                                    required
                                >
                                    {EQUIPMENT_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Linha 2: Marca & Geração */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between mb-1.5 flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingEqBrand(!isCreatingEqBrand)}
                                        className="p-1 rounded-md text-white/40 hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                                        title="Adicionar nova marca"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <label className="text-sm font-medium text-white/70 block w-full !mb-0 text-left">Marca do Equipamento</label>
                                </div>

                                {isCreatingEqBrand ? (
                                    <div className="flex items-center gap-2 animate-fade-in relative">
                                        <input
                                            type="text"
                                            value={newEqBrandName}
                                            onChange={(e) => setNewEqBrandName(e.target.value)}
                                            placeholder="Nome da marca"
                                            className="form-input !py-2.5"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleCreateBrand('equipamento', newEqBrandName)}
                                            className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
                                        >
                                            Salvar
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        value={equipmentBrandId}
                                        onChange={(e) => setEquipmentBrandId(e.target.value)}
                                        className="form-input"
                                        required
                                    >
                                        <option value="" disabled className="bg-slate-900">Selecione uma marca</option>
                                        {equipmentBrands.map(b => (
                                            <option key={b.id} value={b.id} className="bg-slate-900">{b.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Garantia do Equip. (Anos)</label>
                                <input
                                    type="number"
                                    value={equipmentWarranty}
                                    onChange={(e) => setEquipmentWarranty(e.target.value)}
                                    placeholder="Ex: 10"
                                    className="form-input"
                                    min="0"
                                />
                            </div>

                            {equipmentType !== 'Wallbox' && (
                                <div className="space-y-2 animate-fade-in">
                                    <label className="text-sm font-medium text-white/70">Geração Média Mensal do Kit (kWh/mês)</label>
                                    <input
                                        type="number"
                                        value={estimatedGeneration}
                                        onChange={(e) => setEstimatedGeneration(e.target.value)}
                                        placeholder="Ex: 500"
                                        className="form-input"
                                        min="0"
                                        step="0.1"
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <div className="border-t border-white/[0.04] my-2" />

                        {/* Linha 3: Placas */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Qtde. de Placas</label>
                                <input
                                    type="number"
                                    value={panelsCount}
                                    onChange={(e) => setPanelsCount(e.target.value)}
                                    placeholder="Ex: 12"
                                    className="form-input"
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Potência da Placa (W)</label>
                                <input
                                    type="number"
                                    value={panelPower}
                                    onChange={(e) => setPanelPower(e.target.value)}
                                    placeholder="Ex: 550"
                                    className="form-input"
                                    min="10"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between mb-1.5 flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingPanelBrand(!isCreatingPanelBrand)}
                                        className="p-1 rounded-md text-white/40 hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                                        title="Adicionar nova marca"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <label className="text-sm font-medium text-white/70 block w-full !mb-0 text-left">Marca da Placa</label>
                                </div>

                                {isCreatingPanelBrand ? (
                                    <div className="flex items-center gap-2 animate-fade-in relative">
                                        <input
                                            type="text"
                                            value={newPanelBrandName}
                                            onChange={(e) => setNewPanelBrandName(e.target.value)}
                                            placeholder="Nome da marca"
                                            className="form-input !py-2.5"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleCreateBrand('placa', newPanelBrandName)}
                                            className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
                                        >
                                            Salvar
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        value={panelBrandId}
                                        onChange={(e) => setPanelBrandId(e.target.value)}
                                        className="form-input"
                                        required
                                    >
                                        <option value="" disabled className="bg-slate-900">Selecione uma marca</option>
                                        {panelBrands.map(b => (
                                            <option key={b.id} value={b.id} className="bg-slate-900">{b.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Garantia da Placa (Anos)</label>
                                <input
                                    type="number"
                                    value={panelWarranty}
                                    onChange={(e) => setPanelWarranty(e.target.value)}
                                    placeholder="Ex: 12"
                                    className="form-input"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="border-t border-white/[0.04] my-2" />

                        {/* Linha 4: Total */}
                        <div className="grid md:grid-cols-2 gap-6 bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-primary">Potência Total do Sistema (kWp)</label>
                                <input
                                    type="number"
                                    value={systemPower}
                                    onChange={(e) => setSystemPower(e.target.value)}
                                    placeholder="Ex: 6.6"
                                    className="form-input bg-black/20 focus:bg-black/40 border-primary/20"
                                    min="0.1"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-emerald-400">Valor do Kit (R$)</label>
                                <input
                                    type="number"
                                    value={kitPrice}
                                    onChange={(e) => setKitPrice(e.target.value)}
                                    placeholder="Ex: 15400.00"
                                    className="form-input bg-black/20 focus:bg-black/40 border-emerald-500/20 text-emerald-100"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>

                        <div className="border-t border-white/[0.04] my-2" />

                        {/* Linha 5: Apresentação (Imagem e Observações) */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Imagem do Kit (Upload)</label>
                                <div className="flex gap-4 items-start">
                                    <div className="flex-1 space-y-2">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                                                <ImageIcon className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg, image/webp"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setImageFile(file);
                                                        setImagePreviewUrl(URL.createObjectURL(file));
                                                    }
                                                }}
                                                className="form-input pl-10 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                                            />
                                        </div>
                                        <p className="text-[11px] text-white/40">
                                            * Formatos aceitos: PNG, JPEG ou WebP. Tamanho máximo recomendado 500kb.
                                        </p>
                                    </div>
                                    {imagePreviewUrl && (
                                        <div className="w-24 h-24 rounded-lg border border-white/10 bg-black/20 overflow-hidden flex-shrink-0 relative group">
                                            <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => { setImageFile(null); setImagePreviewUrl(null); }}
                                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-red-400"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Observações / Detalhes do Kit</label>
                                <div className="bg-slate-800/80 border border-white/[0.1] rounded-xl overflow-hidden [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-white/[0.1] [&_.ql-container]:border-0 [&_.ql-container]:min-h-[200px] [&_.ql-editor]:text-white [&_.ql-editor]:text-sm [&_.ql-editor]:font-medium [&_.ql-editor_p]:mb-4">
                                    <ReactQuill
                                        theme="snow"
                                        value={description}
                                        onChange={setDescription}
                                        modules={modules}
                                        placeholder="Escreva os detalhes técnicos, garantias, o que está incluso no kit..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            {editingKitId && (
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => { resetForm(); setActiveTab('list'); }}
                                    className="bg-white/5 hover:bg-white/10 text-white/70 px-6 py-2.5 rounded-lg font-medium transition-colors border border-white/10 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                {editingKitId ? 'Salvar Alterações' : 'Salvar Kit no Banco'}
                            </button>
                        </div>
                    </form>
                </TabsContent>
            </Tabs>
        </div>
    );
}
