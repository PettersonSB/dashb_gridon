import React, { useState, useEffect } from 'react';
import { emitToast } from '@/components/ui/Toaster';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { kitService } from '@/services/kitService';
import { SolarKit } from '@/lib/types';
import { Sun, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductList from '@/components/BudgetKits/ProductList';
import KitList from '@/components/BudgetKits/KitList';
import KitForm from '@/components/BudgetKits/KitForm';
import { confirmAction } from "@/components/ui/ConfirmDialog";


export default function BudgetKits() {
    const queryClient = useQueryClient();



    const { data: kits = [], isLoading: isLoadingKits, refetch: refetchKits } = useQuery({
        queryKey: ['solarKits'],
        queryFn: () => kitService.getKits(),
    });

    // Form State
    const [editingKit, setEditingKit] = useState<SolarKit | null>(null);
    const [activeTab, setActiveTab] = useState('list');
    const [successMessage, setSuccessMessage] = useState('');
    const [isKitModalOpen, setIsKitModalOpen] = useState(false);

    const handleEditKit = (kit: SolarKit) => {
        setEditingKit(kit);
        setIsKitModalOpen(true);
    };

    const handleDeleteKit = async (id: string) => {
        if (!await confirmAction({ title: "Excluir Kit", message: "Tem certeza que deseja excluir este kit? Esta ação não pode ser desfeita e pode dar erro se o kit estiver atrelado a algum orçamento.", variant: "danger" })) return;

        try {
            await kitService.deleteKit(id);
            setSuccessMessage('Kit excluído com sucesso!');
            refetchKits();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error(error);
            emitToast({ title: "Erro", description: "Erro ao excluir o kit. Pode ser que já exista um orçamento usando este kit.", variant: "destructive" });
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-slate-900 border border-white/5">
                    <TabsTrigger value="list" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        Kits Cadastrados
                    </TabsTrigger>
                    <TabsTrigger value="products" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        Produtos
                    </TabsTrigger>
                </TabsList>

                {/* TAB: LIST */}
                <TabsContent value="list" className="space-y-4 outline-none">
                    <KitList
                        kits={kits}
                        isLoadingKits={isLoadingKits}
                        handleEditKit={handleEditKit}
                        handleDeleteKit={handleDeleteKit}
                        onOpenNewKit={() => {
                            setEditingKit(null);
                            setIsKitModalOpen(true);
                        }}
                    />
                </TabsContent>

                {/* TAB: PRODUCTS */}
                <TabsContent value="products" className="space-y-6 outline-none">
                    <ProductList />
                </TabsContent>
            </Tabs>

            {/* MODAL POP-UP FOR KIT FORM */}
            {isKitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1A1D24] border border-white/10 rounded-2xl shadow-2xl custom-scrollbar relative">
                        {/* Close button sticky at the top right of modal container */}
                        <div className="sticky top-0 right-0 p-4 flex justify-end z-[60] bg-gradient-to-b from-[#1A1D24] to-transparent pointer-events-none">
                             <button
                                onClick={() => setIsKitModalOpen(false)}
                                className="pointer-events-auto bg-black/50 text-white/50 hover:text-white p-2 rounded-full backdrop-blur-md hover:bg-white/10 transition-colors"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-6 md:p-8 pt-0">
                            <KitForm
                                initialKit={editingKit}
                                onSuccess={() => {
                                    refetchKits();
                                    setIsKitModalOpen(false);
                                }}
                                onCancel={() => {
                                    setEditingKit(null);
                                    setIsKitModalOpen(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}
