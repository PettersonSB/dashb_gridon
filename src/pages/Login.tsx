import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Zap, Loader2, AlertCircle } from "lucide-react";

const Login = () => {
    const { signIn, user, loading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // If already logged in, redirect to dashboard
    if (!loading && user) return <Navigate to="/" replace />;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        const { error } = await signIn(email, password);
        if (error) {
            setError(error === "Invalid login credentials" ? "Email ou senha incorretos" : error);
        }
        setSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-[0.08]"
                    style={{ background: "radial-gradient(circle, hsl(195 100% 50%), transparent)" }}
                />
                <div
                    className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-[100px] opacity-[0.05]"
                    style={{ background: "radial-gradient(circle, hsl(220 80% 55%), transparent)" }}
                />
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="font-display text-2xl font-bold text-white">Gridon Dashboard</h1>
                    <p className="text-sm text-white/40 mt-1">Faça login para acessar o painel</p>
                </div>

                {/* Login Card */}
                <div className="glass-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="admin@gridon.com.br"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="form-label">Senha</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="glow-btn w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                "Entrar"
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-white/20 mt-6">
                    Gridon Energia Solar — Painel Administrativo
                </p>
            </div>
        </div>
    );
};

export default Login;
