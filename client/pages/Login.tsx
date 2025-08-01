import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { 
  Plane, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Fingerprint, 
  Smartphone,
  Key,
  Shield,
  ArrowRight,
  Chrome,
  Building,
  QrCode,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { advancedSecurityService } from "@/lib/advanced-security-service";
import { mobileFeaturesService } from "@/lib/mobile-features-service";

type LoginStep = "credentials" | "2fa" | "biometric" | "sso_redirect";
type TwoFactorMethod = "SMS" | "EMAIL" | "AUTHENTICATOR" | "BIOMETRIC" | "BACKUP";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>("credentials");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [selectedTwoFactorMethod, setSelectedTwoFactorMethod] = useState<TwoFactorMethod>("AUTHENTICATOR");
  const [ssoProviders, setSsoProviders] = useState<any[]>([]);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showSecurityFeatures, setShowSecurityFeatures] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const { user, loading: authLoading, initialized, signIn, signUp } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    checkSecurityFeatures();
  }, []);

  const checkSecurityFeatures = async () => {
    try {
      // Check if SSO is enabled
      const ssoEnabled = await advancedSecurityService.isSSOEnabled();
      if (ssoEnabled) {
        setSsoProviders([
          { id: "google", name: "Google", icon: Chrome },
          { id: "microsoft", name: "Microsoft", icon: Building },
          { id: "corporate", name: "Corporate SSO", icon: Shield },
        ]);
      }

      // Check biometric availability
      const biometricEnabled = await mobileFeaturesService.biometricAuth.isAvailable();
      setBiometricAvailable(biometricEnabled);

      // Check if any advanced security features are enabled
      const securityFeaturesEnabled = ssoEnabled || biometricEnabled || 
        await advancedSecurityService.isTwoFactorEnabled();
      setShowSecurityFeatures(securityFeaturesEnabled);
    } catch (error) {
      console.error("Error checking security features:", error);
    }
  };

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
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
            <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto hidden">
              <Plane className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-white text-xl font-medium">Carregando sistema de segurança...</p>
        </div>
      </div>
    );
  }

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
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
      const { error, data } = isSignUp
        ? await signUp(email, password, {
            display_name: email.split("@")[0],
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
        setIsSignUp(false);
      } else {
        // Check if 2FA is required
        const userId = data?.user?.id || email;
        setPendingUserId(userId);
        
        const twoFactorEnabled = await advancedSecurityService.isTwoFactorEnabled();
        if (twoFactorEnabled) {
          setLoginStep("2fa");
          toast({
            title: "Autenticação de dois fatores",
            description: "Por favor, insira o código de verificação.",
          });
        } else {
          // Login successful
          await advancedSecurityService.logAuditEvent({
            userId,
            userEmail: email,
            action: "login",
            resource: "authentication",
            details: { method: "password" },
            severity: "low",
            category: "authentication",
            success: true,
          });

          toast({
            title: "Login realizado",
            description: "Bem-vindo ao AviationOps!",
          });
        }
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

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!twoFactorCode || !pendingUserId) {
      toast({
        title: "Erro",
        description: "Por favor, insira o código de verificação.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const isValid = await advancedSecurityService.verifyTwoFactor(
        pendingUserId,
        twoFactorCode,
        selectedTwoFactorMethod
      );

      if (isValid) {
        // Create secure session
        await advancedSecurityService.createSecureSession(
          pendingUserId,
          "127.0.0.1" // Would be actual IP in production
        );

        toast({
          title: "Login realizado",
          description: "Autenticação de dois fatores bem-sucedida!",
        });

        // Reset state and redirect will happen automatically
        setLoginStep("credentials");
        setPendingUserId(null);
        setTwoFactorCode("");
      } else {
        toast({
          title: "Código inválido",
          description: "O código de verificação está incorreto.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao verificar código de autenticação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    if (!pendingUserId) return;

    setLoading(true);

    try {
      const success = await mobileFeaturesService.biometricAuth.authenticate(pendingUserId);
      
      if (success) {
        toast({
          title: "Login realizado",
          description: "Autenticação biométrica bem-sucedida!",
        });

        setLoginStep("credentials");
        setPendingUserId(null);
      } else {
        toast({
          title: "Falha na autenticação",
          description: "Não foi possível verificar sua identidade biométrica.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro biométrico",
        description: "Erro ao processar autenticação biométrica.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSSOLogin = async (provider: string) => {
    setLoading(true);

    try {
      // Mock SSO authentication
      const mockToken = `valid_${provider}_${Date.now()}`;
      const result = await advancedSecurityService.authenticateSSO(mockToken);

      if (result.success) {
        toast({
          title: "Login SSO realizado",
          description: `Bem-vindo via ${provider}!`,
        });
      } else {
        toast({
          title: "Erro SSO",
          description: result.error || "Falha na autenticação SSO.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar autenticação SSO.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const send2FACode = async (method: TwoFactorMethod) => {
    if (!pendingUserId) return;

    try {
      setSelectedTwoFactorMethod(method);
      
      // Mock sending code
      toast({
        title: "Código enviado",
        description: `Código de verificação enviado via ${method === "SMS" ? "SMS" : method === "EMAIL" ? "Email" : "App Authenticator"}.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o código.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="saas-card w-full max-w-md mx-4">
        <CardHeader className="text-center space-y-6 pt-8">
          <div className="flex justify-center">
            <img
              src="/airplus-logo.png"
              alt="AirPlus Aviation"
              className="h-16 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
            <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl hidden">
              <Plane className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-white">
              AirPlus Aviation
            </CardTitle>
            <CardDescription className="text-blue-200 text-base">
              {loginStep === "2fa" 
                ? "Autenticação de dois fatores"
                : isSignUp 
                ? "Criar nova conta" 
                : "Entre na sua conta"}
            </CardDescription>
          </div>

          {/* Security Features Indicator */}
          {showSecurityFeatures && (
            <div className="flex justify-center space-x-2">
              {ssoProviders.length > 0 && (
                <Badge variant="outline" className="text-blue-300 border-blue-400/50">
                  <Shield className="h-3 w-3 mr-1" />
                  SSO
                </Badge>
              )}
              {biometricAvailable && (
                <Badge variant="outline" className="text-green-300 border-green-400/50">
                  <Fingerprint className="h-3 w-3 mr-1" />
                  Biometria
                </Badge>
              )}
              <Badge variant="outline" className="text-purple-300 border-purple-400/50">
                <Key className="h-3 w-3 mr-1" />
                2FA
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          {loginStep === "credentials" && (
            <>
              {/* SSO Login Options */}
              {ssoProviders.length > 0 && !isSignUp && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-white/70 text-sm">Login rápido</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {ssoProviders.map((provider) => {
                      const IconComponent = provider.icon;
                      return (
                        <Button
                          key={provider.id}
                          onClick={() => handleSSOLogin(provider.name)}
                          disabled={loading}
                          variant="outline"
                          className="w-full border-white/30 text-white hover:bg-white/20 h-12"
                        >
                          <IconComponent className="h-5 w-5 mr-3" />
                          Continuar com {provider.name}
                        </Button>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/30" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-900 px-2 text-white/70">Ou</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Traditional Login Form */}
              <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-white text-base font-medium">
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
                  <Label htmlFor="password" className="text-white text-base font-medium">
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
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                    <div className="flex items-center">
                      <span>Entrar</span>
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </div>
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
            </>
          )}

          {loginStep === "2fa" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Shield className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Verificação de Segurança</h3>
                <p className="text-white/70 text-sm">
                  Para sua segurança, precisamos verificar sua identidade
                </p>
              </div>

              <Tabs value={selectedTwoFactorMethod} onValueChange={(value) => setSelectedTwoFactorMethod(value as TwoFactorMethod)}>
                <TabsList className="grid w-full grid-cols-3 bg-white/10">
                  <TabsTrigger value="AUTHENTICATOR" className="text-white">
                    <Key className="h-4 w-4 mr-1" />
                    App
                  </TabsTrigger>
                  <TabsTrigger value="SMS" className="text-white">
                    <Smartphone className="h-4 w-4 mr-1" />
                    SMS
                  </TabsTrigger>
                  {biometricAvailable && (
                    <TabsTrigger value="BIOMETRIC" className="text-white">
                      <Fingerprint className="h-4 w-4 mr-1" />
                      Bio
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="AUTHENTICATOR" className="space-y-4">
                  <div className="text-center">
                    <p className="text-white/70 text-sm">Insira o código do seu app authenticator</p>
                  </div>
                  <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                    <Input
                      type="text"
                      placeholder="000000"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      className="mobile-input text-center text-2xl tracking-widest"
                      maxLength={6}
                      disabled={loading}
                    />
                    <Button type="submit" className="mobile-button w-full" disabled={loading || twoFactorCode.length !== 6}>
                      {loading ? "Verificando..." : "Verificar Código"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="SMS" className="space-y-4">
                  <div className="text-center">
                    <p className="text-white/70 text-sm">Enviaremos um código via SMS</p>
                  </div>
                  <Button
                    onClick={() => send2FACode("SMS")}
                    className="mobile-button w-full"
                    disabled={loading}
                  >
                    <Smartphone className="h-5 w-5 mr-2" />
                    Enviar SMS
                  </Button>
                  {selectedTwoFactorMethod === "SMS" && (
                    <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                      <Input
                        type="text"
                        placeholder="000000"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        className="mobile-input text-center text-2xl tracking-widest"
                        maxLength={6}
                        disabled={loading}
                      />
                      <Button type="submit" className="mobile-button w-full" disabled={loading || twoFactorCode.length !== 6}>
                        {loading ? "Verificando..." : "Verificar Código SMS"}
                      </Button>
                    </form>
                  )}
                </TabsContent>

                {biometricAvailable && (
                  <TabsContent value="BIOMETRIC" className="space-y-4">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Fingerprint className="h-12 w-12 text-green-400" />
                      </div>
                      <p className="text-white/70 text-sm">Use sua impressão digital ou reconhecimento facial</p>
                    </div>
                    <Button
                      onClick={handleBiometricAuth}
                      className="mobile-button w-full bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      {loading ? "Verificando..." : "Autenticar com Biometria"}
                    </Button>
                  </TabsContent>
                )}
              </Tabs>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => {
                    setLoginStep("credentials");
                    setPendingUserId(null);
                    setTwoFactorCode("");
                  }}
                  className="text-blue-300 hover:text-white text-sm"
                  disabled={loading}
                >
                  �� Voltar ao login
                </Button>
              </div>
            </div>
          )}

          {/* Security Status Indicator */}
          {showSecurityFeatures && (
            <div className="p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl border border-green-400/30">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <p className="text-green-200 text-sm font-medium">
                  Sistema com segurança avançada ativada
                </p>
              </div>
              <p className="text-green-100/70 text-xs mt-1">
                2FA, SSO e autenticação biométrica disponíveis
              </p>
            </div>
          )}

          {/* Demo mode indicator */}
          <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl border border-yellow-400/30">
            <p className="text-yellow-200 text-sm text-center leading-relaxed">
              <strong>Modo Demo:</strong> Todas as funcionalidades de segurança estão em modo demonstração
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
