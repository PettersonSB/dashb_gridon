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
                    // Prefill a default set of steps for new surveys to help user
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
            } catch (err) {
                console.error("Erro ao carregar dados iniciais:", err);
                emitToast({ title: "Erro", description: "Falha ao carregar informações.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [isEditing, id]);

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
        <form onSubmit={handleSubmit} className="animate-fade-in space-y-6 max-w-4xl pb-20">
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

            {/* Content Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left side: Client Info */}
                <div className="md:col-span-1 space-y-5">
                    <div className="glass-card p-6 space-y-5">
                        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Dados do Cliente</h3>
                        
                        {/* Auto Prefill Selector */}
                        {!isEditing && budgets.length > 0 && (
                            <div>
                                <label className="form-label">Preencher de um Orçamento</label>
                                <select
                                    value={selectedBudgetId}
                                    onChange={(e) => handleBudgetChange(e.target.value)}
                                    className="form-input bg-slate-900 border-white/10 text-white/80"
                                >
                                    <option value="">-- Selecione para preencher --</option>
                                    {budgets.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.customer_name} ({b.kit?.system_power} kWp)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="form-label">Nome Completo</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                                placeholder="Ex: Petterson SB"
                                className="form-input"
                            />
                        </div>

                        <div>
                            <label className="form-label">Telefone (WhatsApp)</label>
                            <input
                                type="text"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                required
                                placeholder="Ex: 61992387499"
                                className="form-input"
                            />
                        </div>

                        <div>
                            <label className="form-label">Email (Opcional)</label>
                            <input
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="Ex: cliente@email.com"
                                className="form-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Right side: Dynamic Step Builder */}
                <div className="md:col-span-2 space-y-5">
                    <div className="glass-card p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
                            <div>
                                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Etapas da Vistoria</h3>
                                <p className="text-xs text-white/30 mt-1">Defina quais mídias serão solicitadas e em qual ordem.</p>
                            </div>
                            
                            {/* Add Step Actions */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => addStep('images')}
                                    className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> +Fotos
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addStep('video')}
                                    className="px-2.5 py-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> +Vídeo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addStep('audio')}
                                    className="px-2.5 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> +Áudio
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addStep('text')}
                                    className="px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> +Texto
                                </button>
                            </div>
                        </div>

                        {/* List of Builder Steps */}
                        {steps.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-xl text-white/30 text-sm">
                                Nenhuma etapa criada ainda. Use os botões acima para adicionar solicitações.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {steps.map((step, index) => {
                                    const isFirst = index === 0;
                                    const isLast = index === steps.length - 1;

                                    return (
                                        <div key={step.id} className="p-4 rounded-xl border border-white/[0.04] bg-slate-900/30 flex gap-4 transition-all hover:border-white/[0.08] relative group">
                                            {/* Reorder Buttons Column */}
                                            <div className="flex flex-col justify-center items-center gap-2 pr-1">
                                                <button
                                                    type="button"
                                                    disabled={isFirst}
                                                    onClick={() => moveStep(index, 'up')}
                                                    className="p-1 rounded bg-white/5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-white/40 transition-colors"
                                                    title="Mover para cima"
                                                >
                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="text-[10px] font-bold text-white/20 select-none">
                                                    {index + 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    disabled={isLast}
                                                    onClick={() => moveStep(index, 'down')}
                                                    className="p-1 rounded bg-white/5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-white/40 transition-colors"
                                                    title="Mover para baixo"
                                                >
                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Inputs Column */}
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        {step.type === 'images' && <Image className="w-4 h-4 text-emerald-400" />}
                                                        {step.type === 'video' && <Video className="w-4 h-4 text-sky-400" />}
                                                        {step.type === 'audio' && <Music className="w-4 h-4 text-purple-400" />}
                                                        {step.type === 'text' && <FileText className="w-4 h-4 text-amber-400" />}
                                                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                                                            {step.type === 'images' ? 'Fotos' : step.type === 'video' ? 'Vídeo' : step.type === 'audio' ? 'Áudio' : 'Comentário'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-medium text-white/40 block mb-1">Título da Etapa (Cliente)</label>
                                                        <input
                                                            type="text"
                                                            value={step.title}
                                                            onChange={(e) => updateStepField(step.id, 'title', e.target.value)}
                                                            placeholder="Ex: Foto do Relógio Padrão"
                                                            required
                                                            className="bg-slate-950 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white/90 focus:outline-none focus:border-amber-500 w-full transition-colors"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-end items-center gap-4">
                                                        {step.type === 'images' && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[11px] text-white/40">Mínimo de fotos</span>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    max={15}
                                                                    value={step.min_qty || 1}
                                                                    onChange={(e) => updateStepField(step.id, 'min_qty', parseInt(e.target.value) || 1)}
                                                                    className="bg-slate-950 border border-white/5 rounded px-1.5 py-0.5 text-center text-xs text-white w-12 focus:outline-none focus:border-amber-500 transition-colors"
                                                                />
                                                            </div>
                                                        )}
                                                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                            <input
                                                                type="checkbox"
                                                                checked={step.required}
                                                                onChange={(e) => updateStepField(step.id, 'required', e.target.checked)}
                                                                className="rounded border-white/10 bg-slate-950 text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                                                            />
                                                            <span className="text-[11px] text-white/40">Obrigatório</span>
                                                        </label>
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-medium text-white/40 block mb-1">Instruções para o Cliente</label>
                                                        <input
                                                            type="text"
                                                            value={step.description}
                                                            onChange={(e) => updateStepField(step.id, 'description', e.target.value)}
                                                            placeholder="Ex: Tire a foto mostrando bem os disjuntores."
                                                            required
                                                            className="bg-slate-950 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white/90 focus:outline-none focus:border-amber-500 w-full transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Bin Column */}
                                            <div className="flex items-center pl-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeStep(step.id)}
                                                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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

            </div>
        </form>
    );
}
