import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Search,
    Edit,
    Trash2,
    Eye,
    Copy,
    CheckCheck,
    Plus,
    Loader2,
    ClipboardList,
    Image,
    Video,
    Music,
    FileText,
    X,
    Calendar,
    Phone,
    Mail,
    ExternalLink
} from "lucide-react";
import { surveyService } from "@/services/surveyService";
import { SolarSurvey, SurveyStep } from "@/lib/types";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import { emitToast } from "@/components/ui/Toaster";

export default function SurveyList() {
    const navigate = useNavigate();
    const [surveys, setSurveys] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [viewingSurvey, setViewingSurvey] = useState<any | null>(null);

    const loadSurveys = async () => {
        try {
            setIsLoading(true);
            const data = await surveyService.getSurveys();
            setSurveys(data);
        } catch (err) {
            console.error("Erro ao carregar vistorias:", err);
            setError("Não foi possível carregar a lista de vistorias.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSurveys();
    }, []);

    const handleDelete = async (id: string) => {
        if (!await confirmAction({ 
            title: "Excluir Vistoria", 
            message: "Tem certeza que deseja excluir esta vistoria permanentemente? Todas as mídias salvas no servidor serão apagadas.", 
            variant: "danger" 
        })) return;

        try {
            await surveyService.deleteSurvey(id);
            emitToast({ title: "Sucesso", description: "Vistoria excluída com sucesso." });
            loadSurveys();
        } catch (error) {
            emitToast({ title: "Erro", description: "Erro ao excluir a vistoria.", variant: "destructive" });
        }
    };

    const handleCopyLink = (survey: SolarSurvey) => {
        const clientDomain = window.location.origin.includes('localhost') 
            ? 'http://localhost:5173' 
            : 'https://gridon.com.br';
            
        const url = `${clientDomain}/vistoria/${survey.id}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedId(survey.id);
            setTimeout(() => setCopiedId(null), 2000);
            emitToast({ title: "Copiado", description: "Link da vistoria copiado para a área de transferência!" });
        });
    };

    const filteredSurveys = surveys.filter(s => {
        const matchSearch = s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.customer_phone.includes(searchTerm) ||
                            s.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchSearch;
    });

    const getStepIcon = (type: string) => {
        switch (type) {
            case 'images': return <Image className="w-4 h-4 text-emerald-400" />;
            case 'video': return <Video className="w-4 h-4 text-sky-400" />;
            case 'audio': return <Music className="w-4 h-4 text-purple-400" />;
            case 'text': return <FileText className="w-4 h-4 text-amber-400" />;
            default: return <FileText className="w-4 h-4 text-white/40" />;
        }
    };

    const getStepTypeName = (type: string) => {
        switch (type) {
            case 'images': return 'Fotos';
            case 'video': return 'Vídeo';
            case 'audio': return 'Áudio';
            case 'text': return 'Comentário';
            default: return type;
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            'pendente': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'enviado': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            'respondido': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };

        const labels = {
            'pendente': 'Pendente',
            'enviado': 'Link Enviado',
            'respondido': 'Respondido',
        };

        return (
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${styles[status as keyof typeof styles] || 'bg-white/10 text-white/60'}`}>
                {labels[status as keyof typeof labels] || status}
            </span>
        );
    };

    return (
        <div className="animate-fade-in space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="section-title !mb-0">Vistorias Técnicas</h2>
                        <p className="section-subtitle">Solicite e visualize mídias de vistoria dos clientes.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-full md:w-64 transition-colors"
                        />
                    </div>
                    <Link
                        to="/budget/surveys/new"
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" /> Criar Solicitação
                    </Link>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-white/40 uppercase bg-white/[0.02] border-b border-white/[0.04]">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Cliente</th>
                                    <th className="px-6 py-4 font-medium">Contato</th>
                                    <th className="px-6 py-4 font-medium">Etapas Solicitadas</th>
                                    <th className="px-6 py-4 font-medium text-center">Status</th>
                                    <th className="px-6 py-4 font-medium">Orçamento Ref.</th>
                                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSurveys.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-white/40">
                                            Nenhuma solicitação de vistoria encontrada.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSurveys.map((survey) => (
                                        <tr key={survey.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-white">{survey.customer_name}</div>
                                                <div className="text-xs text-white/40 mt-1 flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Criado em: {new Date(survey.created_at).toLocaleDateString('pt-BR')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white/80 flex items-center gap-1.5 text-xs">
                                                    <Phone className="w-3.5 h-3.5 text-white/40" />
                                                    {survey.customer_phone}
                                                </div>
                                                {survey.customer_email && (
                                                    <div className="text-white/40 flex items-center gap-1.5 text-xs mt-1 truncate max-w-[180px]">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        {survey.customer_email}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {survey.steps && survey.steps.map((step: SurveyStep) => (
                                                        <span 
                                                            key={step.id} 
                                                            className="inline-flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-[10px] text-white/70"
                                                            title={`${step.title}${step.required ? ' (Obrigatório)' : ''}`}
                                                        >
                                                            {getStepIcon(step.type)}
                                                            {getStepTypeName(step.type)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge status={survey.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                {survey.budget ? (
                                                    <div>
                                                        <Link 
                                                            to={`/budget/preview/${survey.budget.id}`}
                                                            className="text-amber-500 hover:underline font-medium text-xs flex items-center gap-1"
                                                        >
                                                            Ver Orçamento <ExternalLink className="w-3 h-3" />
                                                        </Link>
                                                        <span className="text-[10px] text-white/30 block mt-0.5">
                                                            {survey.budget.kit?.system_power} kWp
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-white/30">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2 text-white/40">
                                                    {/* Copy Link */}
                                                    <button
                                                        onClick={() => handleCopyLink(survey)}
                                                        className={`p-2 rounded-lg transition-colors ${copiedId === survey.id
                                                            ? 'bg-emerald-500/10 text-emerald-400'
                                                            : 'hover:bg-white/10 hover:text-amber-500'
                                                        }`}
                                                        title="Copiar link da vistoria"
                                                    >
                                                        {copiedId === survey.id ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                    </button>

                                                    {/* View Responses */}
                                                    {survey.status === 'respondido' ? (
                                                        <button
                                                            onClick={() => setViewingSurvey(survey)}
                                                            className="p-2 hover:bg-white/10 hover:text-emerald-400 rounded-lg transition-colors"
                                                            title="Ver respostas da vistoria"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled
                                                            className="p-2 opacity-20 cursor-not-allowed"
                                                            title="Ainda não respondido"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Edit Config */}
                                                    <button
                                                        onClick={() => navigate(`/budget/surveys/edit/${survey.id}`)}
                                                        className="p-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                                        title="Editar configurações"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDelete(survey.id)}
                                                        className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                                        title="Excluir permanentemente"
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
            )}

            {/* View Responses Modal */}
            {viewingSurvey && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#13161C] border border-white/10 rounded-2xl shadow-2xl custom-scrollbar relative flex flex-col">
                        
                        {/* Header */}
                        <div className="sticky top-0 p-6 flex justify-between items-center bg-[#13161C] border-b border-white/[0.06] z-10">
                            <div>
                                <h3 className="text-lg font-bold text-white">Vistoria de {viewingSurvey.customer_name}</h3>
                                <p className="text-xs text-white/40 mt-1">Celular: {viewingSurvey.customer_phone} | Respondido em: {new Date(viewingSurvey.updated_at).toLocaleString('pt-BR')}</p>
                            </div>
                            <button
                                onClick={() => setViewingSurvey(null)}
                                className="bg-white/5 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 md:p-8 space-y-6 flex-1">
                            {viewingSurvey.steps && viewingSurvey.steps.map((step: SurveyStep, index: number) => {
                                const response = viewingSurvey.responses?.[step.id];

                                return (
                                    <div key={step.id} className="p-5 rounded-xl bg-slate-900/40 border border-white/[0.04] space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-500 font-bold flex items-center justify-center text-xs">
                                                {index + 1}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                {getStepIcon(step.type)}
                                                <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                                            </div>
                                        </div>
                                        <p className="text-xs text-white/40 pl-8">{step.description}</p>

                                        {/* Response Render */}
                                        <div className="pl-8 pt-2">
                                            {!response ? (
                                                <span className="text-xs text-red-400 font-medium italic">Não respondido / Pulado</span>
                                            ) : (
                                                <>
                                                    {step.type === 'images' && response.urls && (
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                            {response.urls.map((url: string, i: number) => (
                                                                <a 
                                                                    key={i} 
                                                                    href={url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group hover:border-amber-500/30 transition-all bg-black/20 block"
                                                                >
                                                                    <img src={url} alt={`Anexo ${i+1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {step.type === 'video' && response.url && (
                                                        <div className="max-w-md rounded-lg overflow-hidden border border-white/10 bg-black/20">
                                                            <video src={response.url} controls className="w-full h-auto max-h-[300px]" />
                                                        </div>
                                                    )}

                                                    {step.type === 'audio' && response.url && (
                                                        <div className="max-w-md bg-[#1D212A] border border-white/5 p-3 rounded-lg flex items-center gap-3">
                                                            <Music className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                                            <audio src={response.url} controls className="w-full h-8" />
                                                        </div>
                                                    )}

                                                    {step.type === 'text' && response.text && (
                                                        <p className="text-sm text-white/80 bg-[#1D212A] border border-white/5 p-4 rounded-xl whitespace-pre-wrap">
                                                            {response.text}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
