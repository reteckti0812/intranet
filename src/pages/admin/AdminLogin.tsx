import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Adicionado Link
import logo from "@/assets/logo.png";
import { Lock, Mail, Loader2, AlertCircle, ArrowLeft } from "lucide-react"; // Adicionado ArrowLeft
import api from "@/lib/api";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/admins/login", { email, password });

      if (response.data.success) {
        const admin = response.data.admin as {
          id: number;
          name: string;
          email: string;
          role?: string;
        };
        localStorage.setItem("admin_token", response.data.token);
        localStorage.setItem(
          "admin_user",
          JSON.stringify({ ...admin, role: admin.role === "super" ? "super" : "admin" })
        );
        navigate("/admin");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-card rounded-2xl shadow-card-hover border border-border p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={logo} alt="Re-Teck" className="h-12 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground">Área Administrativa</h1>
          <p className="text-sm text-muted-foreground mt-1">Faça login para continuar</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2 mb-4 border border-destructive/20">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="admin@reteck.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Verificando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border flex flex-col gap-3">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
          >
            <ArrowLeft size={16} />
            Voltar para a Intranet
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;