import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const { canAccessRoute, getDefaultRoute } = usePermissions();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Verificar permissão para a rota atual
    if (!canAccessRoute(location.pathname)) {
        const defaultRoute = getDefaultRoute();
        return <Navigate to={defaultRoute} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
