import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Loader2, User, Home, Zap, MapPin, Calculator, DollarSign, Percent, TrendingUp, HandCoins, HardHat, Receipt, BarChart3, Pencil, Plus } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { budgetService } from '@/services/budgetService';
import { kitService } from '@/services/kitService';
import { SolarBudget, SolarKit } from '@/lib/types';

const INSTALLATION_LOCATIONS = [
    'telhado fibrocimento', 'telhado colonial', 'telhado de concreto',
    'telhado zinco', 'laje', 'solo'
] as const;

const CONSTRUCTION_TYPES = [
    'residencial', 'comercial', 'industrial',
    'predio residencial', 'predio comercial', 'rural'
] as const;

const SUPPLY_TYPES = ['monofasico', 'bifasico', 'trifasico'] as const;

export default function NewBudget() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    // UI State
    const [isLoadingData, setIsLoadingData] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [availableKits, setAvailableKits] = useState<SolarKit[]>([]);

    // Form State - Customer
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerCity, setCustomerCity] = useState('');
    const [customerNeighborhood, setCustomerNeighborhood] = useState('');
    const [customerState, setCustomerState] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');

    // Form State - Installation
    const [averageMonthlyConsumption, setAverageMonthlyConsumption] = useState('');
    const [energyTariff, setEnergyTariff] = useState('0.85'); // default value
    const [installationLocation, setInstallationLocation] = useState<SolarBudget['installation_location']>('telhado colonial');
    const [constructionType, setConstructionType] = useState<SolarBudget['construction_type']>('residencial');
    const [supplyType, setSupplyType] = useState<SolarBudget['supply_type']>('monofasico');
    const [installationWarranty, setInstallationWarranty] = useState('');

    // Form State - Proposal
    const [selectedKitId, setSelectedKitId] = useState('');
    const [validityDays, setValidityDays] = useState('7');
    const [notes, setNotes] = useState('');
    const [includeNotes, setIncludeNotes] = useState(true);

    // Form State - Financial
    const [laborCost, setLaborCost] = useState<string>('0');
    const [engineeringCost, setEngineeringCost] = useState<string>('0');
    
    const [profitType, setProfitType] = useState<'percentage' | 'fixed'>('percentage');
    const [profitValue, setProfitValue] = useState<string>('0');
    
    const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>('percentage');
    const [commissionValue, setCommissionValue] = useState<string>('0');
    
    const [taxType, setTaxType] = useState<'percentage' | 'fixed'>('percentage');
    const [taxValue, setTaxValue] = useState<string>('0');

    // Form State - Payment Methods
    const [cashDiscount, setCashDiscount] = useState<string>('0');
    const [cashMode, setCashMode] = useState<'automatic' | 'manual'>('automatic');
    const [cashManualValue, setCashManualValue] = useState<string>('0');
    const [cashEnabled, setCashEnabled] = useState<boolean>(true);

    const [pixDiscount, setPixDiscount] = useState<string>('0');
    const [pixMode, setPixMode] = useState<'automatic' | 'manual'>('automatic');
    const [pixManualValue, setPixManualValue] = useState<string>('0');
    const [pixEnabled, setPixEnabled] = useState<boolean>(true);
    
    interface FinancingOption {
        id: number;
        name: string;
        installments: number;
        interest: number;
        enabled: boolean;
        calculationMode: 'automatic' | 'manual';
        manualTotalValue: string;
        acceptedCards?: string[];
        interestFree?: boolean;
    }

    const [financingOptions, setFinancingOptions] = useState<FinancingOption[]>([
        { id: 1, name: 'Parcelamento 1', installments: 12, interest: 0, enabled: true, calculationMode: 'automatic', manualTotalValue: '0', acceptedCards: [], interestFree: false },
        { id: 2, name: 'Parcelamento 2', installments: 24, interest: 0, enabled: false, calculationMode: 'automatic', manualTotalValue: '0', acceptedCards: [], interestFree: false },
        { id: 3, name: 'Parcelamento 3', installments: 36, interest: 0, enabled: false, calculationMode: 'automatic', manualTotalValue: '0', acceptedCards: [], interestFree: false },
        { id: 4, name: 'Parcelamento 4', installments: 48, interest: 0, enabled: false, calculationMode: 'automatic', manualTotalValue: '0', acceptedCards: [], interestFree: false }
    ]);

    useEffect(() => {
        const init = async () => {
            await loadKits();
            if (isEditing && id) {
                await loadBudgetToEdit(id);
            }
        };
        init();
    }, [id, isEditing]);

    const loadKits = async () => {
        try {
            const kits = await kitService.getKits();
            setAvailableKits(kits);
        } catch (err) {
            console.error("Erro ao carregar kits:", err);
            setError("Não foi possível carregar os kits disponíveis.");
        }
    };

    const loadBudgetToEdit = async (budgetId: string) => {
        try {
            const budgetData = await budgetService.getBudgetById(budgetId);
            setCustomerName(budgetData.customer_name);
            setCustomerPhone(budgetData.customer_phone);
            setCustomerCity(budgetData.customer_city);
            setCustomerNeighborhood(budgetData.customer_neighborhood || '');
            setCustomerState(budgetData.customer_state);
            setCustomerEmail(budgetData.customer_email || '');

            setAverageMonthlyConsumption(budgetData.average_monthly_consumption?.toString() || '');
            setEnergyTariff(budgetData.energy_tariff?.toString() || '0.85');
            setInstallationLocation(budgetData.installation_location);
            setConstructionType(budgetData.construction_type);
            setSupplyType(budgetData.supply_type);
            setInstallationWarranty(budgetData.installation_warranty.toString());

            setSelectedKitId(budgetData.kit_id);
            setValidityDays(budgetData.proposal_validity_days.toString());
            const savedNotes = budgetData.installation_notes || '';
            setNotes(savedNotes);
            setIncludeNotes(savedNotes.trim().length > 0 && savedNotes !== '<p><br></p>');

            // Novos campos financeiros
            setLaborCost(budgetData.labor_cost?.toString() || '0');
            setEngineeringCost(budgetData.engineering_cost?.toString() || '0');
            setProfitType(budgetData.profit_type || 'percentage');
            setProfitValue(budgetData.profit_value?.toString() || '0');
            setCommissionType(budgetData.commission_type || 'percentage');
            setCommissionValue(budgetData.commission_value?.toString() || '0');
            setTaxType(budgetData.tax_type || 'percentage');
            setTaxValue(budgetData.tax_value?.toString() || '0');
            
            // Novos campos de pagamento
            setCashDiscount(budgetData.cash_discount?.toString() || '0');
            setCashMode(budgetData.cash_mode || 'automatic');
            setCashManualValue(budgetData.cash_manual_value?.toString() || '0');
            setCashEnabled(budgetData.cash_enabled ?? true);
            
            setPixDiscount(budgetData.pix_discount?.toString() || '0');
            setPixMode(budgetData.pix_mode || 'automatic');
            setPixManualValue(budgetData.pix_manual_value?.toString() || '0');
            setPixEnabled(budgetData.pix_enabled ?? true);

            if (budgetData.financing_options && Array.isArray(budgetData.financing_options)) {
                // Mesclar opções salvas com estrutura padrão para garantir todos campos (ex: manualTotalValue)
                const merged = [1, 2, 3, 4].map(id => {
                    const saved = budgetData.financing_options?.find((o: any) => o.id === id);
                    if (saved) {
                        return {
                            ...saved,
                            manualTotalValue: saved.manualTotalValue || '0',
                            calculationMode: saved.calculationMode || 'automatic'
                        } as FinancingOption;
                    }
                    return {
                        id,
                        name: `Parcelamento ${id}`,
                        installments: id * 12,
                        interest: 0,
                        enabled: false,
                        calculationMode: 'automatic',
                        manualTotalValue: '0'
                    } as FinancingOption;
                });
                setFinancingOptions(merged);
            }
        } catch (err) {
            console.error("Erro ao carregar orçamento", err);
            setError("Orçamento não encontrado.");
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!selectedKitId) {
            setError('Selecione um Kit Solar para compor este orçamento.');
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_city: customerCity,
                customer_neighborhood: customerNeighborhood,
                customer_state: customerState,
                customer_email: customerEmail || null,

                average_monthly_consumption: averageMonthlyConsumption ? Number(averageMonthlyConsumption) : null,
                energy_tariff: energyTariff ? Number(energyTariff.replace(',', '.')) : 0.85,
                installation_location: installationLocation,
                construction_type: constructionType,
                supply_type: supplyType,
                installation_warranty: Number(installationWarranty),

                kit_id: selectedKitId,
                proposal_validity_days: Number(validityDays),
                installation_notes: includeNotes ? (notes || null) : null,

                // Novos campos financeiros para persistência
                labor_cost: Number(laborCost),
                engineering_cost: Number(engineeringCost),
                profit_type: profitType,
                profit_value: Number(profitValue),
                commission_type: commissionType,
                commission_value: Number(commissionValue),
                tax_type: taxType,
                tax_value: Number(taxValue),
                cash_discount: Number(cashDiscount),
                cash_mode: cashMode,
                cash_manual_value: Number(cashManualValue),
                cash_enabled: cashEnabled,
                pix_discount: Number(pixDiscount),
                pix_mode: pixMode,
                pix_manual_value: Number(pixManualValue),
                pix_enabled: pixEnabled,
                financing_options: financingOptions
            };

            if (isEditing && id) {
                await budgetService.updateBudget(id, payload);
                setSuccessMessage('Orçamento atualizado com sucesso!');
            } else {
                await budgetService.createBudget(payload);
                setSuccessMessage('Orçamento gerado e salvo com sucesso!');
            }

            // Redireciona para visão geral após 1.5s
            setTimeout(() => {
                navigate('/budget/list');
            }, 1500);

        } catch (err) {
            console.error("Erro ao salvar orçamento:", err);
            setError(err instanceof Error ? err.message : "Erro desconhecido ao salvar o orçamento.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const addFinancingOption = () => {
        if (financingOptions.length >= 4) return;
        const newId = Math.max(...financingOptions.map(o => o.id)) + 1;
        setFinancingOptions([...financingOptions, {
            id: newId,
            name: `Parcelamento ${financingOptions.length + 1}`,
            installments: 36,
            interest: 0,
            enabled: false,
            calculationMode: 'automatic',
            manualTotalValue: '0',
            acceptedCards: [],
            interestFree: false
        }]);
    };

    // Derived Financial Values
    const selectedKit = availableKits.find(k => k.id === selectedKitId);
    const subtotal = Number(selectedKit?.kit_price || 0);
    
    const labor = Number(laborCost) || 0;
    const engineering = Number(engineeringCost) || 0;
    
    const profitAmt = profitType === 'percentage' 
        ? (subtotal * (Number(profitValue) || 0) / 100) 
        : (Number(profitValue) || 0);
        
    const commissionAmt = commissionType === 'percentage' 
        ? (subtotal * (Number(commissionValue) || 0) / 100) 
        : (Number(commissionValue) || 0);
        
    const taxAmt = taxType === 'percentage' 
        ? (subtotal * (Number(taxValue) || 0) / 100) 
        : (Number(taxValue) || 0);

    const totalValue = subtotal + labor + engineering + profitAmt + commissionAmt + taxAmt;

    // Payment Methods Calculations (respeitando modo manual)
    const cashTotal = cashMode === 'manual' 
        ? (Number(cashManualValue) || 0)
        : totalValue * (1 - (Number(cashDiscount) || 0) / 100);

    const pixTotal = pixMode === 'manual' 
        ? (Number(pixManualValue) || 0)
        : totalValue * (1 - (Number(pixDiscount) || 0) / 100);
    
    const calculatedFinancing = financingOptions.map(opt => {
        // Se estiver em modo manual, o principal é o valor total manual
        const principal = opt.calculationMode === 'manual' 
            ? (Number(opt.manualTotalValue) || 0)
            : totalValue;

        const months = opt.installments;
        const monthlyRate = opt.calculationMode === 'manual' 
            ? 0 // No juros automático em modo manual
            : (opt.interest || 0) / 100;
        
        let monthlyPayment = 0;
        let totalFinanced = 0;
        
        if (opt.calculationMode === 'manual') {
            totalFinanced = Number(opt.manualTotalValue) || 0;
            monthlyPayment = totalFinanced / months;
        } else if (monthlyRate === 0) {
            monthlyPayment = principal / months;
            totalFinanced = principal;
        } else {
            // Price Table installments formula: PMT = P * [i * (1 + i)^n] / [(1 + i)^n - 1]
            monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
            totalFinanced = monthlyPayment * months;
        }
        
        return {
            ...opt,
            monthlyPayment,
            totalFinanced
        };
    });

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
        ],
    };

    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6 pb-20">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="section-title !mb-0">{isEditing ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
                    <p className="section-subtitle">{isEditing ? 'Atualize as informações da proposta financeira' : 'Gere propostas financeiras atreladas aos Kits Solares'}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Coluna Esquerda: Dados do Formulário */}
                <div className="lg:col-span-8 space-y-6">

                {/* Alertas */}
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {successMessage}
                    </div>
                )}

                {/* Bloco 1: Dados do Cliente */}
                <div className="glass-card p-6 md:p-8">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Dados do Cliente
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Nome Completo</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="João da Silva"
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Telefone / WhatsApp</label>
                            <input
                                type="text"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="(00) 00000-0000"
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Bairro</label>
                            <input
                                type="text"
                                value={customerNeighborhood}
                                onChange={(e) => setCustomerNeighborhood(e.target.value)}
                                placeholder="Centro"
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Cidade</label>
                            <input
                                type="text"
                                value={customerCity}
                                onChange={(e) => setCustomerCity(e.target.value)}
                                placeholder="São Paulo"
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Estado (UF)</label>
                            <input
                                type="text"
                                value={customerState}
                                onChange={(e) => setCustomerState(e.target.value)}
                                placeholder="SP"
                                className="form-input"
                                maxLength={2}
                                required
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-white/70">E-mail (Opcional)</label>
                            <input
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="joao@email.com"
                                className="form-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Bloco 2: Informações da Instalação */}
                <div className="glass-card p-6 md:p-8">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Home className="w-5 h-5 text-orange-400" />
                        Informações da Instalação
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-red-400">Consumo Médio Mensal do Cliente (kWh)</label>
                            <input
                                type="number"
                                value={averageMonthlyConsumption}
                                onChange={(e) => setAverageMonthlyConsumption(e.target.value)}
                                placeholder="Ex: 450"
                                className="form-input bg-red-500/5 focus:bg-red-500/10 border-red-500/20 text-white placeholder:text-white/20"
                                min="0"
                                required
                            />
                            <p className="text-[11px] text-white/40 mt-1">* Usado para gerar os gráficos no orçamento.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-emerald-400">Tarifa de Energia (R$/kWh)</label>
                            <input
                                type="number"
                                value={energyTariff}
                                onChange={(e) => setEnergyTariff(e.target.value)}
                                placeholder="Ex: 0.85"
                                className="form-input bg-emerald-500/5 focus:bg-emerald-500/10 border-emerald-500/20 text-white"
                                min="0"
                                step="0.01"
                                required
                            />
                            <p className="text-[11px] text-white/40 mt-1">* Usado como base para cálculos financeiros e economia.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Local de Instalação</label>
                            <select
                                value={installationLocation}
                                onChange={(e) => setInstallationLocation(e.target.value as any)}
                                className="form-input capitalize"
                                required
                            >
                                {INSTALLATION_LOCATIONS.map(loc => (
                                    <option key={loc} value={loc} className="bg-slate-900 capitalize">{loc}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Tipo de Construção</label>
                            <select
                                value={constructionType}
                                onChange={(e) => setConstructionType(e.target.value as any)}
                                className="form-input capitalize"
                                required
                            >
                                {CONSTRUCTION_TYPES.map(type => (
                                    <option key={type} value={type} className="bg-slate-900 capitalize">{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Tipo de Fornecimento</label>
                            <select
                                value={supplyType}
                                onChange={(e) => setSupplyType(e.target.value as any)}
                                className="form-input capitalize"
                                required
                            >
                                {SUPPLY_TYPES.map(type => (
                                    <option key={type} value={type} className="bg-slate-900 capitalize">{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Garantia da Instalação (Anos)</label>
                            <input
                                type="number"
                                value={installationWarranty}
                                onChange={(e) => setInstallationWarranty(e.target.value)}
                                placeholder="Ex: 5"
                                className="form-input"
                                min="0"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Bloco 3: Proposta Comercial */}
                <div className="glass-card p-6 md:p-8">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-emerald-400" />
                        Proposta Comercial
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Kit Solar do Orçamento</label>
                            <select
                                value={selectedKitId}
                                onChange={(e) => setSelectedKitId(e.target.value)}
                                className="form-input bg-primary/10 border-primary/20 text-white"
                                required
                            >
                                <option value="" disabled className="bg-slate-900">Selecione um Kit Cadastrado</option>
                                {availableKits.map(kit => {
                                    const items = kit.items || [];
                                    const inv = items.find(i => i.product?.category.toLowerCase().includes('inversor') || i.product?.category.toLowerCase().includes('micro'));
                                    const panels = items.filter(i => i.product?.category.toLowerCase().includes('módulo') || i.product?.category.toLowerCase().includes('placa'));
                                    const totalPanels = panels.reduce((s, i) => s + i.quantity, 0);
                                    const mainPanel = panels[0]?.product;

                                    const invText = inv 
                                        ? `${inv.product?.name} ${inv.product?.brand?.name || ''}`.trim()
                                        : `${kit.equipment_type || ''} ${kit.equipment_brand?.name || ''}`.trim();
                                    
                                    const panelsText = totalPanels > 0
                                        ? `${totalPanels} placas ${mainPanel?.power}W ${mainPanel?.brand?.name || ''}`.trim()
                                        : `${kit.panels_count || ''} placas ${kit.panel_power || ''}W ${kit.panel_brand?.name || ''}`.trim();

                                    return (
                                        <option key={kit.id} value={kit.id} className="bg-slate-900">
                                            {kit.system_power}kWp - {invText || 'Equipamento'} - {panelsText || 'Módulos'} - {Number(kit.kit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </option>
                                    );
                                })}
                            </select>
                            {availableKits.length === 0 && (
                                <p className="text-xs text-red-400 mt-1">Nenhum kit encontrado. Cadastre um Kit Solar primeiro.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Validade da Proposta (Dias)</label>
                            <input
                                type="number"
                                value={validityDays}
                                onChange={(e) => setValidityDays(e.target.value)}
                                placeholder="Ex: 7"
                                className="form-input"
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="includeNotes"
                                checked={includeNotes}
                                onChange={(e) => setIncludeNotes(e.target.checked)}
                                className="w-4 h-4 rounded bg-white/[0.05] border-white/20 text-primary focus:ring-primary focus:ring-offset-background"
                            />
                            <label htmlFor="includeNotes" className="text-sm font-medium text-white/70 cursor-pointer select-none">
                                Incluir Observações / Escopo da Instalação no orçamento do cliente
                            </label>
                        </div>

                        {includeNotes && (
                            <div className="bg-slate-800/80 border border-white/[0.1] rounded-xl overflow-hidden [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-white/[0.1] [&_.ql-container]:border-0 [&_.ql-container]:min-h-[200px] [&_.ql-editor]:text-white [&_.ql-editor]:text-sm [&_.ql-editor]:font-medium [&_.ql-editor_p]:mb-4 animate-fade-in-up">
                                <ReactQuill
                                    theme="snow"
                                    value={notes}
                                    onChange={setNotes}
                                    modules={quillModules}
                                    placeholder="Escreva aqui detalhes adicionais do serviço (ex: estrutura necessária, aterramento, prazos específicos...)"
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-8 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting || availableKits.length === 0}
                            className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                </div>

                {/* Coluna Direita: Sidebar Financeira */}
                <div className="lg:col-span-4 space-y-6 sticky top-6">
                    {/* Bloco: Resumo Financeiro */}
                    <div className="glass-card p-6 border-emerald-500/20 bg-emerald-500/[0.02]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <BarChart3 className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Resumo Financeiro</h3>
                                <p className="text-[10px] text-white/40 uppercase tracking-wider">Subtotal, extras e total</p>
                            </div>
                        </div>

                        <div className="space-y-3 pb-6 border-b border-white/5">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Subtotal (Kit)</span>
                                <span className="text-white font-medium">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Mão de Obra</span>
                                <span className="text-white font-medium">{labor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Engenharia</span>
                                <span className="text-white font-medium">{engineering.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Lucro</span>
                                <span className="text-emerald-400 font-medium">+{profitAmt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Comissão</span>
                                <span className="text-white font-medium">+{commissionAmt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Impostos</span>
                                <span className="text-white font-medium">+{taxAmt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        </div>

                        <div className="pt-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Valor Total do Orçamento</span>
                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                                    {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bloco: Custos e Acréscimos */}
                    <div className="glass-card p-6 border-primary/10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <HandCoins className="w-4 h-4 text-orange-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Custos e Acréscimos</h3>
                                <p className="text-[10px] text-white/40 uppercase tracking-wider">Configuração de margens</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-white/50 flex items-center gap-1.5">
                                        <HardHat className="w-3 h-3" /> Mão de Obra (R$)
                                    </label>
                                    <input
                                        type="number"
                                        value={laborCost}
                                        onChange={(e) => setLaborCost(e.target.value)}
                                        className="form-input !py-2 !text-sm bg-white/[0.03]"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-white/50 flex items-center gap-1.5">
                                        <Pencil className="w-3 h-3" /> Engenharia (R$)
                                    </label>
                                    <input
                                        type="number"
                                        value={engineeringCost}
                                        onChange={(e) => setEngineeringCost(e.target.value)}
                                        className="form-input !py-2 !text-sm bg-white/[0.03]"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Lucro */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium text-white/50 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Lucro</span>
                                    <div className="flex bg-white/5 rounded-md p-0.5">
                                        <button 
                                            type="button"
                                            onClick={() => setProfitType('percentage')}
                                            className={`px-2 py-0.5 text-[9px] rounded-sm transition-all ${profitType === 'percentage' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-white/40 hover:text-white'}`}
                                        >
                                            %
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setProfitType('fixed')}
                                            className={`px-2 py-0.5 text-[9px] rounded-sm transition-all ${profitType === 'fixed' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-white/40 hover:text-white'}`}
                                        >
                                            R$
                                        </button>
                                    </div>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={profitValue}
                                        onChange={(e) => setProfitValue(e.target.value)}
                                        className="form-input !py-2 !text-sm !pr-10 bg-white/[0.03]"
                                        placeholder="0"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-xs font-bold">
                                        {profitType === 'percentage' ? '%' : 'R$'}
                                    </div>
                                </div>
                            </div>

                            {/* Comissão */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium text-white/50 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5"><HandCoins className="w-3 h-3" /> Comissão</span>
                                    <div className="flex bg-white/5 rounded-md p-0.5">
                                        <button 
                                            type="button"
                                            onClick={() => setCommissionType('percentage')}
                                            className={`px-2 py-0.5 text-[9px] rounded-sm transition-all ${commissionType === 'percentage' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-white/40 hover:text-white'}`}
                                        >
                                            %
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setCommissionType('fixed')}
                                            className={`px-2 py-0.5 text-[9px] rounded-sm transition-all ${commissionType === 'fixed' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-white/40 hover:text-white'}`}
                                        >
                                            R$
                                        </button>
                                    </div>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={commissionValue}
                                        onChange={(e) => setCommissionValue(e.target.value)}
                                        className="form-input !py-2 !text-sm !pr-10 bg-white/[0.03]"
                                        placeholder="0"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-xs font-bold">
                                        {commissionType === 'percentage' ? '%' : 'R$'}
                                    </div>
                                </div>
                            </div>

                            {/* Impostos */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium text-white/50 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5"><Receipt className="w-3 h-3" /> Impostos</span>
                                    <div className="flex bg-white/5 rounded-md p-0.5">
                                        <button 
                                            type="button"
                                            onClick={() => setTaxType('percentage')}
                                            className={`px-2 py-0.5 text-[9px] rounded-sm transition-all ${taxType === 'percentage' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-white/40 hover:text-white'}`}
                                        >
                                            %
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setTaxType('fixed')}
                                            className={`px-2 py-0.5 text-[9px] rounded-sm transition-all ${taxType === 'fixed' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-white/40 hover:text-white'}`}
                                        >
                                            R$
                                        </button>
                                    </div>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={taxValue}
                                        onChange={(e) => setTaxValue(e.target.value)}
                                        className="form-input !py-2 !text-sm !pr-10 bg-white/[0.03]"
                                        placeholder="0"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-xs font-bold">
                                        {taxType === 'percentage' ? '%' : 'R$'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bloco: Formas de Pagamento */}
                    <div className="glass-card p-6 border-white/10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Formas de Pagamento</h3>
                                <p className="text-[10px] text-white/40 uppercase tracking-wider">Mostre as opções ao cliente</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                             {/* À Vista */}
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-black text-white uppercase tracking-wider">À vista</span>
                                        <span className="text-lg font-black text-primary">
                                            {cashTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 p-3 bg-white/[0.05] rounded-xl border border-white/10 shadow-inner">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                            <span className="text-[10px] uppercase font-black text-white/50 tracking-widest">Tipo de Cálculo</span>
                                        </div>
                                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                                            <button 
                                                type="button"
                                                onClick={() => setCashMode('automatic')}
                                                className={`px-4 py-1.5 text-xs uppercase font-black rounded-md transition-all ${cashMode === 'automatic' ? 'bg-primary text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                                            >
                                                Automático
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setCashMode('manual')}
                                                className={`px-4 py-1.5 text-xs uppercase font-black rounded-md transition-all ${cashMode === 'manual' ? 'bg-amber-500 text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                                            >
                                                Manual
                                            </button>
                                        </div>
                                    </div>
                                
                                {cashMode === 'automatic' ? (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Desconto (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={cashDiscount}
                                                onChange={(e) => setCashDiscount(e.target.value)}
                                                className="form-input !py-1.5 !text-xs bg-white/[0.03] !pr-8"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-bold">%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Valor Manual (R$)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={cashManualValue}
                                                onChange={(e) => setCashManualValue(e.target.value)}
                                                className="form-input !py-1.5 !text-xs bg-white/[0.03] !pr-8"
                                                placeholder="0,00"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-bold">R$</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                    <input
                                        type="checkbox"
                                        checked={cashEnabled}
                                        onChange={(e) => setCashEnabled(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer"
                                    />
                                    <label className="text-xs text-white/70">Habilitar</label>
                                </div>
                            </div>

                            {/* Pix */}
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-black text-white uppercase tracking-wider">PIX</span>
                                        <span className="text-lg font-black text-primary">
                                            {pixTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 p-3 bg-white/[0.05] rounded-xl border border-white/10 shadow-inner">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                            <span className="text-[10px] uppercase font-black text-white/50 tracking-widest">Tipo de Cálculo</span>
                                        </div>
                                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                                            <button 
                                                type="button"
                                                onClick={() => setPixMode('automatic')}
                                                className={`px-4 py-1.5 text-xs uppercase font-black rounded-md transition-all ${pixMode === 'automatic' ? 'bg-primary text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                                            >
                                                Automático
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setPixMode('manual')}
                                                className={`px-4 py-1.5 text-xs uppercase font-black rounded-md transition-all ${pixMode === 'manual' ? 'bg-amber-500 text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                                            >
                                                Manual
                                            </button>
                                        </div>
                                    </div>

                                {pixMode === 'automatic' ? (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Desconto (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={pixDiscount}
                                                onChange={(e) => setPixDiscount(e.target.value)}
                                                className="form-input !py-1.5 !text-xs bg-white/[0.03] !pr-8"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-bold">%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Valor Manual (R$)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={pixManualValue}
                                                onChange={(e) => setPixManualValue(e.target.value)}
                                                className="form-input !py-1.5 !text-xs bg-white/[0.03] !pr-8"
                                                placeholder="0,00"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-bold">R$</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                    <input
                                        type="checkbox"
                                        checked={pixEnabled}
                                        onChange={(e) => setPixEnabled(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer"
                                    />
                                    <label className="text-xs text-white/70">Habilitar</label>
                                </div>
                            </div>

                            {/* Opções de Parcelamento */}
                            {financingOptions.map((opt, idx) => {
                                const calc = calculatedFinancing[idx];
                                return (
                                    <div key={opt.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-medium text-white/50">Nome da Opção</label>
                                            <input
                                                type="text"
                                                value={opt.name}
                                                onChange={(e) => {
                                                    const newOptions = [...financingOptions];
                                                    newOptions[idx].name = e.target.value;
                                                    setFinancingOptions(newOptions);
                                                }}
                                                className="form-input !py-2 !text-sm bg-white/[0.03]"
                                            />
                                        </div>

                                        <div className="flex justify-between items-start">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm font-black text-white uppercase tracking-wider">{opt.name}</p>
                                                    <p className="text-base font-black text-white group-hover:text-primary transition-colors">
                                                        {calc.totalFinanced.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between gap-3 p-2.5 bg-white/[0.05] rounded-xl border border-white/10 shadow-inner">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                        <span className="text-[9px] uppercase font-black text-white/40 tracking-widest">Cálculo</span>
                                                    </div>
                                                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                const newOptions = [...financingOptions];
                                                                newOptions[idx].calculationMode = 'automatic';
                                                                setFinancingOptions(newOptions);
                                                            }}
                                                            className={`px-3 py-1 text-[10px] uppercase font-black rounded-md transition-all ${opt.calculationMode === 'automatic' ? 'bg-primary text-black shadow-sm' : 'text-white/40 hover:text-white'}`}
                                                        >
                                                            Auto
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                const newOptions = [...financingOptions];
                                                                newOptions[idx].calculationMode = 'manual';
                                                                setFinancingOptions(newOptions);
                                                            }}
                                                            className={`px-3 py-1 text-[10px] uppercase font-black rounded-md transition-all ${opt.calculationMode === 'manual' ? 'bg-amber-500 text-black shadow-sm' : 'text-white/40 hover:text-white'}`}
                                                        >
                                                            Manual
                                                        </button>
                                                    </div>
                                                </div>

                                                <p className="text-[10px] text-white/40 flex items-center gap-2">
                                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                                    {opt.installments}x de {calc.monthlyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Nº Parcelas</label>
                                                <input
                                                    type="number"
                                                    value={opt.installments}
                                                    onChange={(e) => {
                                                        const newOptions = [...financingOptions];
                                                        newOptions[idx].installments = Number(e.target.value) || 1;
                                                        setFinancingOptions(newOptions);
                                                    }}
                                                    className="form-input !py-1.5 !text-xs bg-white/[0.03]"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                {opt.calculationMode === 'automatic' ? (
                                                    <>
                                                        <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Juros/mês (%)</label>
                                                        <input
                                                            type="number"
                                                            value={opt.interest}
                                                            onChange={(e) => {
                                                                const newOptions = [...financingOptions];
                                                                newOptions[idx].interest = Number(e.target.value) || 0;
                                                                setFinancingOptions(newOptions);
                                                            }}
                                                            className="form-input !py-1.5 !text-xs bg-white/[0.03]"
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Valor Total (R$)</label>
                                                        <input
                                                            type="number"
                                                            value={opt.manualTotalValue}
                                                            onChange={(e) => {
                                                                const newOptions = [...financingOptions];
                                                                newOptions[idx].manualTotalValue = e.target.value;
                                                                setFinancingOptions(newOptions);
                                                            }}
                                                            className="form-input !py-1.5 !text-xs bg-white/[0.03]"
                                                            placeholder="0,00"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-white/5 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Bandeiras Aceitas</label>
                                                <div className="flex items-center gap-2">
                                                    {['mastercard', 'visa', 'elo'].map((brand) => (
                                                        <button
                                                            key={brand}
                                                            type="button"
                                                            onClick={() => {
                                                                const newOptions = [...financingOptions];
                                                                const currentCards = newOptions[idx].acceptedCards || [];
                                                                if (currentCards.includes(brand)) {
                                                                    newOptions[idx].acceptedCards = currentCards.filter((c: string) => c !== brand);
                                                                } else {
                                                                    newOptions[idx].acceptedCards = [...currentCards, brand];
                                                                }
                                                                setFinancingOptions(newOptions);
                                                            }}
                                                            className={`px-2 py-0.5 text-[9px] uppercase font-black rounded-sm transition-all ${
                                                                (opt.acceptedCards || []).includes(brand) ? 'bg-primary text-black shadow-sm' : 'bg-white/5 text-white/40 hover:bg-white/10'
                                                            }`}
                                                        >
                                                            {brand}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                 <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={opt.interestFree || false}
                                                        onChange={(e) => {
                                                            const newOptions = [...financingOptions];
                                                            newOptions[idx].interestFree = e.target.checked;
                                                            setFinancingOptions(newOptions);
                                                        }}
                                                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer"
                                                    />
                                                    <label className="text-[11px] text-white/70 font-medium">Oferecer Sem Juros</label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={opt.enabled}
                                                        onChange={(e) => {
                                                            const newOptions = [...financingOptions];
                                                            newOptions[idx].enabled = e.target.checked;
                                                            setFinancingOptions(newOptions);
                                                        }}
                                                        className="w-4 h-4 rounded border-emerald-500/30 bg-white/5 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                                                    />
                                                    <label className="text-[11px] text-emerald-500 font-bold">Habilitar Opção</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                               
                                );
                            })}

                            {financingOptions.length < 4 && (
                                <button
                                    type="button"
                                    onClick={addFinancingOption}
                                    className="w-full py-3 rounded-xl border border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Plus className="w-4 h-4 text-white/40 group-hover:text-primary" />
                                    <span className="text-xs font-medium text-white/40 group-hover:text-primary">Adicionar Opção de Parcelamento</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-primary/20 border border-primary/30">
                        <p className="text-[11px] text-white/90 leading-relaxed">
                            <Zap className="w-3 h-3 inline mr-1 mb-0.5 text-primary" />
                            Os valores acima são calculados automaticamente e serão exibidos na proposta final do cliente.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
