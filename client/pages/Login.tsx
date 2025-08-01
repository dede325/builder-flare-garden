import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Plane, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user, loading: authLoading, initialized, signIn, signUp } = useAuth();
  const { toast } = useToast();

  // Show loading while auth is initializing
  if (!initialized && authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="mx-auto">
            <img
              src="/airplus-logo.png"
              alt="AirPlus Aviation"
              className="h-20 w-auto mx-auto object-contain"
              onError={(e) => {
                // Fallback to icon if logo fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto hidden">
              <Plane className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-white text-xl font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = isSignUp
        ? await signUp(email, password, {
            display_name: email.split("@")[0], // Default display name
            department: "Operações",
          })
        : await signIn(email, password);

      if (error) {
        toast({
          title: "Erro de autenticação",
          description: error.message,
          variant: "destructive",
        });
      } else if (isSignUp) {
        toast({
          title: "Conta criada",
          description: "Conta criada com sucesso. Pode fazer login agora.",
        });
        setIsSignUp(false); // Switch to login mode
      } else {
        toast({
          title: "Login realizado",
          description: "Bem-vindo ao AviationOps!",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="saas-card w-full max-w-md mx-4">
        <CardHeader className="text-center space-y-6 pt-8">
          <div className="flex justify-center">
            <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Plane className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-white">
              AviationOps
            </CardTitle>
            <CardDescription className="text-blue-200 text-base">
              {isSignUp ? "Criar nova conta" : "Entre na sua conta"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label
                htmlFor="email"
                className="text-white text-base font-medium"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 h-5 w-5 text-white/70" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mobile-input pl-12"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="password"
                className="text-white text-base font-medium"
              >
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 h-5 w-5 text-white/70" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mobile-input pl-12 pr-12"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-10 w-10 text-white/70 hover:text-white touch-scale"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="mobile-button w-full text-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processando...</span>
                </div>
              ) : isSignUp ? (
                "Criar Conta"
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-300 hover:text-white text-base touch-scale"
              disabled={loading}
            >
              {isSignUp
                ? "Já tem uma conta? Entre aqui"
                : "Não tem conta? Cadastre-se aqui"}
            </Button>
          </div>

          {/* Demo mode indicator */}
          <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl border border-yellow-400/30">
            <p className="text-yellow-200 text-sm text-center leading-relaxed">
              <strong>Modo Demo:</strong> Configure as variáveis de ambiente do
              Supabase para funcionalidade completa
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
