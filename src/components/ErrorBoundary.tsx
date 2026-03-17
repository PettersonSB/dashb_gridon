import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Erro capturado:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-[50vh] p-8">
                    <div className="glass-card p-8 max-w-lg w-full text-center space-y-5">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white font-display mb-2">
                                Algo deu errado
                            </h2>
                            <p className="text-white/50 text-sm leading-relaxed">
                                Ocorreu um erro inesperado ao renderizar esta página.
                                Tente recarregar ou voltar para a página anterior.
                            </p>
                        </div>

                        {this.state.error && (
                            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-left">
                                <p className="text-xs font-mono text-red-300/70 break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-5 py-2.5 rounded-xl font-medium transition-colors border border-white/10 flex items-center gap-2 text-sm"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Tentar Novamente
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
                            >
                                Voltar ao Início
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
