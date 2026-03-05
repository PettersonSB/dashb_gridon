import { useState, useCallback } from "react";

type ToastProps = {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
};

export const useToast = () => {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const toast = useCallback(({ title, description, variant = "default" }: ToastProps) => {
        const newToast = { title, description, variant };
        setToasts((prev) => [...prev, newToast]);

        // In a real generic implementation, we would auto-dismiss, but 
        // for this dashboard we might just log or rely on a real toast provider later
        console.log(`[Toast] ${variant.toUpperCase()}: ${title} - ${description || ''}`);

        setTimeout(() => {
            setToasts((prev) => prev.filter(t => t !== newToast));
        }, 3000);
    }, []);

    return { toast, toasts };
};
