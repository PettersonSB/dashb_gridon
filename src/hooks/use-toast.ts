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

        // Auto-dismiss after 3s

        setTimeout(() => {
            setToasts((prev) => prev.filter(t => t !== newToast));
        }, 3000);
    }, []);

    return { toast, toasts };
};
