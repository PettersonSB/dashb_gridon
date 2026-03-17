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

    const handleEditKit = (kit: SolarKit) => {
        setEditingKit(kit);
        setActiveTab('new');
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

            <Tabs value={activeTab} onValueChange={(v) => {
                setActiveTab(v);
                if (v === 'new' && !editingKit) setEditingKit(null);
            }} className="space-y-6">
                <TabsList className="bg-slate-900 border border-white/5">
                    <TabsTrigger value="list" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        Kits Cadastrados
                    </TabsTrigger>
                    <TabsTrigger value="products" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        Produtos
                    </TabsTrigger>
                    <TabsTrigger value="new" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        {editingKit ? 'Editar Kit' : 'Novo Kit'}
                    </TabsTrigger>
                </TabsList>

                {/* TAB: LIST */}
                <TabsContent value="list" className="space-y-4 outline-none">
                    <KitList
                        kits={kits}
                        isLoadingKits={isLoadingKits}
                        setActiveTab={setActiveTab}
                        handleEditKit={handleEditKit}
                        handleDeleteKit={handleDeleteKit}
                    />
                </TabsContent>

                {/* TAB: PRODUCTS */}
                <TabsContent value="products" className="space-y-6 outline-none">
                    <ProductList />
                </TabsContent>

                {/* TAB: NEW / EDIT */}
                <TabsContent value="new" className="glass-card p-6 md:p-8 outline-none">

                    <KitForm
                        initialKit={editingKit}
                        onSuccess={() => {
                            refetchKits();
                            setActiveTab('list');
                        }}
                        onCancel={() => {
                            setEditingKit(null);
                            setActiveTab('list');
                        }}
                    />
                </TabsContent>
            </Tabs>


        </div>
    );
}
