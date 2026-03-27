import React from 'react';
import { Loader2, Sun, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { SolarKit } from '@/lib/types';

interface KitListProps {
    kits: SolarKit[];
    isLoadingKits: boolean;
    setActiveTab: (tab: string) => void;
    handleEditKit: (kit: SolarKit) => void;
    handleDeleteKit: (id: string) => void;
}

export default function KitList({ kits, isLoadingKits, setActiveTab, handleEditKit, handleDeleteKit }: KitListProps) {
    if (isLoadingKits) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (kits.length === 0) {
        return (
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
        );
    }

    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kits.map(kit => (
                <div key={kit.id} className="glass-card hover:bg-white/5 transition-colors overflow-hidden flex flex-col">

                    <div className="p-5 flex-1 flex flex-col">
                        <div className="flex-1">
                            {(() => {
                                const items = kit.items || [];
                                const inv = items.find(i => i.product?.category.toLowerCase().includes('inversor') || i.product?.category.toLowerCase().includes('micro'));
                                const panels = items.filter(i => i.product?.category.toLowerCase().includes('módulo') || i.product?.category.toLowerCase().includes('placa'));
                                const totalPanels = panels.reduce((s, i) => s + i.quantity, 0);
                                const mainPanel = panels[0]?.product;

                                const equipmentDisplay = inv 
                                    ? `${inv.product?.name} ${inv.product?.brand?.name ? `(${inv.product.brand.name})` : ''}`
                                    : `${kit.equipment_type || 'Inversor'} ${kit.equipment_brand?.name || ''}`;
                                
                                const panelsDisplay = totalPanels > 0
                                    ? `${totalPanels}x Placas ${mainPanel?.power}W ${mainPanel?.brand?.name ? `(${mainPanel.brand.name})` : ''}`
                                    : `${kit.panels_count || 0}x Placas ${kit.panel_power || 0}W ${kit.panel_brand?.name ? `(${kit.panel_brand.name})` : ''}`;

                                return (
                                    <>
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className="font-display font-bold text-lg text-white line-clamp-1 flex-1" title={equipmentDisplay}>
                                                {equipmentDisplay}
                                            </h3>
                                            <div className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border border-primary/20">
                                                {kit.system_power} kWp
                                            </div>
                                        </div>
                                        <p className="text-sm text-white/50 mb-4 truncate" title={panelsDisplay}>
                                            {panelsDisplay}
                                        </p>
                                    </>
                                );
                            })()}
                            
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
    );
}
