import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Save,
    Loader2,
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    Image,
    Video,
    Music,
    FileText,
    ChevronLeft,
    CheckCircle2
} from "lucide-react";
import { surveyService } from "@/services/surveyService";
import { budgetService } from "@/services/budgetService";
import { SolarBudget, SurveyStep, SolarSurvey } from "@/lib/types";
import { emitToast } from "@/components/ui/Toaster";
import { v4 as uuidv4 } from "uuid";

export default function NewSurvey() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    // Loading states
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDefault, setIsSavingDefault] = useState(false);

    // Form fields
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [selectedBudgetId, setSelectedBudgetId] = useState("");
    const [steps, setSteps] = useState<SurveyStep[]>([]);

    // Data sources
    const [budgets, setBudgets] = useState<SolarBudget[]>([]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsLoading(true);
                // Load budgets for dropdown
                const budgetList = await budgetService.getBudgets();
                setBudgets(budgetList);

                // If editing, load survey data
                if (isEditing && id) {
                    const survey = await surveyService.getSurveyById(id);
                    setCustomerName(survey.customer_name);
                    setCustomerPhone(survey.customer_phone);
                    setCustomerEmail(survey.customer_email || "");
                    setSelectedBudgetId(survey.budget_id || "");
                    setSteps(survey.steps || []);
                } else {
                    // Tenta obter as etapas padrão salvas no banco
                    try {
                        const defaultSteps = await surveyService.getDefaultSteps();
                        if (defaultSteps && defaultSteps.length > 0) {
                            setSteps(defaultSteps);
                        } else {
                            // Fallback se não houver etapas padrão salvas
                            setSteps([
                                {
                                    id: uuidv4(),
                                    type: "images",
                                    title: "Fotos do Local",
                                    description: "Tire fotos frontais do telhado, fiação geral e padrão de entrada (relógio).",
                                    min_qty: 2,
                                    required: true
                                }
                            ]);
                        }
                    } catch (defaultStepsErr) {
                        console.error("Erro ao carregar etapas padrão, usando fallback:", defaultStepsErr);
                        setSteps([
                            {
                                id: uuidv4(),
                                type: "images",
                                title: "Fotos do Local",
                                description: "Tire fotos frontais do telhado, fiação geral e padrão de entrada (relógio).",
                                min_qty: 2,
                                required: true
                            }
                        ]);
                    }
                }
            } catch (err) {
                console.error("Erro ao carregar dados iniciais:", err);
                emitToast({ title: "Erro", description: "Falha ao carregar informações.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [isEditing, id]);

    const handleSaveDefaultSteps = async () => {
        if (steps.length === 0) {
            emitToast({ title: "Erro", description: "Adicione ao menos 1 etapa para salvar como padrão.", variant: "destructive" });
            return;
        }

        setIsSavingDefault(true);
        try {
            await surveyService.saveDefaultSteps(steps);
            emitToast({ title: "Sucesso", description: "Modelo de etapas de vistoria salvo como padrão!" });
        } catch (err: any) {
            console.error("Erro ao salvar etapas padrão:", err);
            emitToast({ title: "Erro", description: "Falha ao salvar etapas padrão no servidor.", variant: "destructive" });
        } finally {
            setIsSavingDefault(false);
        }
    };

    // Handle budget selection to prefill customer details
    const handleBudgetChange = (budgetId: string) => {
        setSelectedBudgetId(budgetId);
        if (budgetId) {
            const selectedBudget = budgets.find(b => b.id === budgetId);
            if (selectedBudget) {
                setCustomerName(selectedBudget.customer_name);
                setCustomerPhone(selectedBudget.customer_phone);
                setCustomerEmail(selectedBudget.customer_email || "");
            }
        }
    };

    // Add a new step
    const addStep = (type: 'images' | 'video' | 'audio' | 'text') => {
        const defaultTitle = {
            images: "Fotos do Local",
            video: "Vídeo do Local",
            audio: "Explicação em Áudio",
            text: "Detalhes Adicionais"
        }[type];

        const defaultDescription = {
            images: "Envie fotos nítidas do local solicitado.",
            video: "Grave um vídeo panorâmico detalhando o espaço.",
            audio: "Grave uma mensagem explicando os detalhes do local.",
            text: "Descreva brevemente detalhes ou dificuldades observadas."
        }[type];

        const newStep: SurveyStep = {
            id: uuidv4(),
            type,
            title: defaultTitle,
            description: defaultDescription,
            required: true,
            ...(type === 'images' ? { min_qty: 1 } : {})
        };

        setSteps([...steps, newStep]);
        emitToast({ title: "Etapa Adicionada", description: `Etapa de ${type} incluída com sucesso.` });
    };

    // Remove a step
    const removeStep = (stepId: string) => {
        setSteps(steps.filter(s => s.id !== stepId));
    };

    // Reorder steps
    const moveStep = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= steps.length) return;

        const reorderedSteps = [...steps];
        const temp = reorderedSteps[index];
        reorderedSteps[index] = reorderedSteps[targetIndex];
        reorderedSteps[targetIndex] = temp;
        setSteps(reorderedSteps);
    };

    // Update individual step values
    const updateStepField = (stepId: string, field: keyof SurveyStep, value: any) => {
        setSteps(steps.map(s => {
            if (s.id === stepId) {
                return { ...s, [field]: value };
            }
            return s;
        }));
    };

    // Submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName || !customerPhone) {
            emitToast({ title: "Erro", description: "Preencha o nome e telefone do cliente.", variant: "destructive" });
            return;
        }

        if (steps.length === 0) {
            emitToast({ title: "Erro", description: "Adicione pelo menos 1 etapa para a vistoria.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: Omit<SolarSurvey, 'id' | 'created_at' | 'updated_at' | 'created_by'> = {
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_email: customerEmail || null,
                steps,
                responses: {},
                status: 'pendente',
                budget_id: selectedBudgetId || null
            };

            if (isEditing && id) {
                await surveyService.updateSurvey(id, payload);
                emitToast({ title: "Sucesso", description: "Solicitação de vistoria atualizada!" });
            } else {
                await surveyService.createSurvey(payload);
                emitToast({ title: "Sucesso", description: "Solicitação de vistoria criada com sucesso!" });
            }
            navigate("/budget/surveys");
        } catch (err: any) {
            console.error("Erro ao salvar vistoria:", err);
            emitToast({ title: "Erro", description: err.message || "Erro ao salvar vistoria.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="animate-fade-in space-y-6 w-full pb-20">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-6 mb-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/budget/surveys")}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="section-title !mb-0">{isEditing ? "Editar Vistoria" : "Nova Vistoria Técnica"}</h2>
                        <p className="section-subtitle">Configure as informações que o cliente enviará.</p>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="glow-btn flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[140px]"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" /> Salvar Solicitação
                        </>
                    )}
                </button>
            </div>

            {/* Layout Reorganizado: Dados do Cliente no topo, Etapas abaixo */}
            <div className="space-y-6">
                
                {/* 1ª Linha: Dados do Cliente (Horizontal) */}
                <div className="glass-card p-6 space-y-5">
                    <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Dados do Cliente</h3>
                    </div>
                    
                    <div className={`grid grid-cols-1 ${(!isEditing && budgets.length > 0) ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4`}>
                        {/* Auto Prefill Selector */}
                        {!isEditing && budgets.length > 0 ? (
                            <div>
                                <label className="form-label text-xs">Preencher de um Orçamento</label>
                                <select
                                    value={selectedBudgetId}
                                    onChange={(e) => handleBudgetChange(e.target.value)}
                                    className="form-input bg-slate-900 border-white/10 text-white/80 h-[46px]"
                                >
                                    <option value="">-- Selecione para preencher --</option>
                                    {budgets.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.customer_name} ({b.kit?.system_power} kWp)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        <div>
                            <label className="form-label text-xs">Nome Completo</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                                placeholder="Ex: Petterson SB"
                                className="form-input h-[46px]"
                            />
                        </div>

                        <div>
                            <label className="form-label text-xs">Telefone (WhatsApp)</label>
                            <input
                                type="text"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                required
                                placeholder="Ex: 61992387499"
                                className="form-input h-[46px]"
                            />
                        </div>

                        <div>
                            <label className="form-label text-xs">Email (Opcional)</label>
                            <input
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="Ex: cliente@email.com"
                                className="form-input h-[46px]"
                            />
                        </div>
                    </div>
                </div>

                {/* 2ª Linha: Dynamic Step Builder (Etapas da Vistoria) */}
                <div className="glass-card p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Etapas da Vistoria</h3>
                            </div>
                            <p className="text-xs text-white/30 mt-1">Defina quais mídias serão solicitadas e em qual ordem.</p>
                        </div>
                        
                        {/* Add Step Actions */}
                        <div className="flex flex-wrap gap-2 items-center">
                            <button
                                type="button"
                                disabled={isSavingDefault || steps.length === 0}
                                onClick={handleSaveDefaultSteps}
                                className="px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 text-amber-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed mr-2"
                                title="Salva este conjunto de etapas como padrão para novas vistorias"
                            >
                                {isSavingDefault ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5" /> Salvar como Padrão
                                    </>
                                )}
                            </button>
                            
                            <div className="w-[1px] h-5 bg-white/10 mr-2" />

                            <button
                                type="button"
                                onClick={() => addStep('images')}
                                className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> + Fotos
                            </button>
                            <button
                                type="button"
                                onClick={() => addStep('video')}
                                className="px-3 py-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> + Vídeo
                            </button>
                            <button
                                type="button"
                                onClick={() => addStep('audio')}
                                className="px-3 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> + Áudio
                            </button>
                            <button
                                type="button"
                                onClick={() => addStep('text')}
                                className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> + Texto
                            </button>
                        </div>
                    </div>

                    {/* List of Builder Steps */}
                    {steps.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl text-white/30 text-sm">
                            Nenhuma etapa criada ainda. Use os botões acima para adicionar solicitações.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {steps.map((step, index) => {
                                const isFirst = index === 0;
                                const isLast = index === steps.length - 1;

                                return (
                                    <div 
                                        key={step.id} 
                                        className="p-4 rounded-2xl border border-white/[0.04] bg-slate-900/30 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 transition-all hover:border-white/[0.1] hover:bg-slate-900/50 relative group"
                                    >
                                        {/* Reorder Buttons Column */}
                                        <div className="flex flex-row lg:flex-col items-center justify-center gap-2 lg:gap-1.5 lg:pr-3 lg:border-r lg:border-white/5 lg:h-12 w-full lg:w-auto">
                                            <button
                                                type="button"
                                                disabled={isFirst}
                                                onClick={() => moveStep(index, 'up')}
                                                className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-10 disabled:cursor-not-allowed transition-colors"
                                                title="Mover para cima"
                                            >
                                                <ArrowUp className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="text-xs font-mono font-bold text-white/40 select-none min-w-[20px] text-center">
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={isLast}
                                                onClick={() => moveStep(index, 'down')}
                                                className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-10 disabled:cursor-not-allowed transition-colors"
                                                title="Mover para baixo"
                                            >
                                                <ArrowDown className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Tipo da Etapa (Badge visual) */}
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 min-w-[130px] justify-center lg:justify-start">
                                            {step.type === 'images' && (
                                                <>
                                                    <Image className="w-4 h-4 text-emerald-400" />
                                                    <span className="text-xs font-semibold text-emerald-400">Fotos</span>
                                                </>
                                            )}
                                            {step.type === 'video' && (
                                                <>
                                                    <Video className="w-4 h-4 text-sky-400" />
                                                    <span className="text-xs font-semibold text-sky-400">Vídeo</span>
                                                </>
                                            )}
                                            {step.type === 'audio' && (
                                                <>
                                                    <Music className="w-4 h-4 text-purple-400" />
                                                    <span className="text-xs font-semibold text-purple-400">Áudio</span>
                                                </>
                                            )}
                                            {step.type === 'text' && (
                                                <>
                                                    <FileText className="w-4 h-4 text-amber-400" />
                                                    <span className="text-xs font-semibold text-amber-400">Texto</span>
                                                </>
                                            )}
                                        </div>

                                        {/* Inputs Column */}
                                         <div className="flex-1 flex flex-col gap-3 w-full">
                                             <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full items-end">
                                                 <div className="md:col-span-4">
                                                     <label className="text-[11px] font-medium text-white/40 block mb-1">Título da Etapa (Cliente)</label>
                                                     <input
                                                         type="text"
                                                         value={step.title}
                                                         onChange={(e) => updateStepField(step.id, 'title', e.target.value)}
                                                         placeholder="Ex: Foto do Relógio Padrão"
                                                         required
                                                         className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 h-[38px]"
                                                     />
                                                 </div>

                                                 <div className="md:col-span-5">
                                                     <label className="text-[11px] font-medium text-white/40 block mb-1">Instruções para o Cliente</label>
                                                     <input
                                                         type="text"
                                                         value={step.description}
                                                         onChange={(e) => updateStepField(step.id, 'description', e.target.value)}
                                                         placeholder="Ex: Tire a foto mostrando bem os disjuntores."
                                                         required
                                                         className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 h-[38px]"
                                                     />
                                                 </div>

                                                 <div className="md:col-span-3 flex flex-row items-center gap-4 justify-start md:justify-end h-full pb-1 md:pb-0">
                                                     {step.type === 'images' && (
                                                         <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-xl px-2.5 py-1.5 h-[38px]">
                                                             <span className="text-[11px] text-white/40 whitespace-nowrap">Mínimo</span>
                                                             <input
                                                                 type="number"
                                                                 min={1}
                                                                 max={15}
                                                                 value={step.min_qty || 1}
                                                                 onChange={(e) => updateStepField(step.id, 'min_qty', parseInt(e.target.value) || 1)}
                                                                 className="bg-slate-950 border border-white/10 rounded px-1.5 py-0.5 text-center text-xs text-white w-10 focus:outline-none focus:border-primary transition-colors"
                                                             />
                                                         </div>
                                                     )}
                                                     
                                                     <label className="flex items-center gap-2 cursor-pointer select-none hover:text-white transition-colors bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2 h-[38px]">
                                                         <input
                                                             type="checkbox"
                                                             checked={step.required}
                                                             onChange={(e) => updateStepField(step.id, 'required', e.target.checked)}
                                                             className="rounded border-white/10 bg-slate-950 text-primary focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                                                         />
                                                         <span className="text-[11px] text-white/40 whitespace-nowrap">Obrigatório</span>
                                                     </label>
                                                 </div>
                                             </div>

                                             {/* Sub-linha para Foto de Exemplo (se for tipo images) */}
                                             {step.type === 'images' && (
                                                 <div className="pt-2.5 border-t border-white/[0.04] flex items-center gap-3 w-full">
                                                     <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Foto de Exemplo:</span>
                                                     {step.example_image_url ? (
                                                         <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-1 pr-3">
                                                             <a 
                                                                 href={step.example_image_url} 
                                                                 target="_blank" 
                                                                 rel="noopener noreferrer"
                                                                 className="w-7 h-7 rounded-lg overflow-hidden border border-white/10 block bg-black/20"
                                                             >
                                                                 <img src={step.example_image_url} alt="Exemplo" className="w-full h-full object-cover" />
                                                             </a>
                                                             <span className="text-[10px] text-white/60 truncate max-w-[150px]">Imagem de exemplo adicionada</span>
                                                             <button
                                                                 type="button"
                                                                 onClick={() => updateStepField(step.id, 'example_image_url', undefined)}
                                                                 className="p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                                 title="Remover foto de exemplo"
                                                             >
                                                                 <Trash2 className="w-3.5 h-3.5" />
                                                             </button>
                                                         </div>
                                                     ) : (
                                                         <label className="cursor-pointer px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 text-white/70 hover:text-white rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition-colors">
                                                             <Plus className="w-3 h-3 text-amber-500" />
                                                             <span>Adicionar Foto de Exemplo</span>
                                                             <input 
                                                                 type="file" 
                                                                 accept="image/*" 
                                                                 className="hidden" 
                                                                 onChange={async (e) => {
                                                                     const file = e.target.files?.[0];
                                                                     if (file) {
                                                                         try {
                                                                             emitToast({ title: "Enviando...", description: "Enviando foto de exemplo..." });
                                                                             const url = await surveyService.uploadExampleImage(file);
                                                                             updateStepField(step.id, 'example_image_url', url);
                                                                             emitToast({ title: "Sucesso", description: "Imagem de exemplo adicionada!" });
                                                                         } catch (err: any) {
                                                                             console.error(err);
                                                                             emitToast({ title: "Erro", description: "Falha ao enviar imagem de exemplo.", variant: "destructive" });
                                                                         }
                                                                     }
                                                                 }}
                                                             />
                                                         </label>
                                                     )}
                                                 </div>
                                             )}
                                         </div>

                                        {/* Action Bin Column */}
                                        <div className="flex items-center justify-end pl-2 border-t border-white/5 lg:border-t-0 pt-2 lg:pt-0 w-full lg:w-auto">
                                            <button
                                                type="button"
                                                onClick={() => removeStep(step.id)}
                                                className="p-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                                                title="Remover etapa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
