import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function BudgetPreview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const publicUrl = `http://gridon.com.br/orcamento/${id}`;
    const previewUrl = `http://gridon.com.br/orcamento/${id}?preview=true`;

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in">
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/budget/list')}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/70 hover:text-white flex items-center gap-2 text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Lista
                    </button>
                    <h2 className="text-xl font-display font-bold text-white">Prévia do Orçamento</h2>
                </div>

                <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glow-btn flex items-center gap-2 text-sm px-4 py-2"
                >
                    <ExternalLink className="w-4 h-4" />
                    Abrir em Nova Aba
                </a>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 glass-card overflow-hidden rounded-xl border border-white/10 relative">
                <iframe
                    src={previewUrl}
                    className="absolute inset-0 w-full h-full border-0 bg-background"
                    title="Prévia do Orçamento"
                />
            </div>
        </div>
    );
}
