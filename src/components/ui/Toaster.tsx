import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastType = {
    id: string;
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
};

// Global toast store — allows calling toast() from anywhere
let globalListeners: Array<(toast: ToastType) => void> = [];

export function emitToast(props: Omit<ToastType, 'id'>) {
    const toast: ToastType = { ...props, id: Math.random().toString(36).slice(2) };
    globalListeners.forEach(fn => fn(toast));
}

export default function Toaster() {
    const [toasts, setToasts] = useState<ToastType[]>([]);

    useEffect(() => {
        const handler = (toast: ToastType) => {
            setToasts(prev => [...prev, toast]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toast.id));
            }, 4000);
        };
        globalListeners.push(handler);
        return () => {
            globalListeners = globalListeners.filter(fn => fn !== handler);
        };
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 max-w-sm">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`
                        animate-fade-in rounded-xl border p-4 shadow-2xl backdrop-blur-xl flex items-start gap-3
                        ${toast.variant === 'destructive'
                            ? 'bg-red-500/10 border-red-500/20 text-red-300'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        }
                    `}
                >
                    {toast.variant === 'destructive' ? (
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white">{toast.title}</p>
                        {toast.description && (
                            <p className="text-xs mt-0.5 opacity-70">{toast.description}</p>
                        )}
                    </div>
                    <button
                        onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                        className="p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                    >
                        <X className="w-3.5 h-3.5 text-white/50" />
                    </button>
                </div>
            ))}
        </div>
    );
}
