import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

type ConfirmOptions = {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
};

type ConfirmState = ConfirmOptions & {
    id: string;
    resolve: (value: boolean) => void;
};

let globalConfirmListener: ((state: ConfirmState) => void) | null = null;

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
        if (globalConfirmListener) {
            globalConfirmListener({
                ...options,
                id: Math.random().toString(36).slice(2),
                resolve
            });
        } else {
            // Fallback for native behaviour if the app tree hasn't mounted it
            resolve(window.confirm(`${options.title}\n\n${options.message}`));
        }
    });
}

export default function ConfirmDialog() {
    const [dialog, setDialog] = useState<ConfirmState | null>(null);

    useEffect(() => {
        globalConfirmListener = setDialog;
        return () => {
            if (globalConfirmListener === setDialog) {
                globalConfirmListener = null;
            }
        };
    }, []);

    if (!dialog) return null;

    const handleClose = (result: boolean) => {
        dialog.resolve(result);
        setDialog(null);
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="glass-card w-full max-w-md flex flex-col animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3 text-white">
                        <div className={`p-2 rounded-xl flex items-center justify-center ${
                            dialog.variant === 'danger' ? 'bg-red-500/20 text-red-400' :
                            dialog.variant === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-primary/20 text-primary'
                        }`}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold font-display">{dialog.title}</h3>
                    </div>
                    <button 
                        onClick={() => handleClose(false)}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6">
                    <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                        {dialog.message}
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 p-6 pt-0">
                    <button 
                        onClick={() => handleClose(false)}
                        className="px-5 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                    >
                        {dialog.cancelText || 'Cancelar'}
                    </button>
                    <button 
                        onClick={() => handleClose(true)}
                        className={`px-6 py-2.5 rounded-xl transition-all text-sm font-bold shadow-lg flex items-center gap-2 ${
                            dialog.variant === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' :
                            dialog.variant === 'warning' ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20' :
                            'bg-primary hover:bg-primary-hover text-white shadow-primary/20'
                        }`}
                    >
                        {dialog.confirmText || 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
