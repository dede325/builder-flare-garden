import "./global.css";

import { Component, ErrorInfo, ReactNode, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import CleaningForms from "./pages/CleaningForms";
import EmployeeManager from "./pages/EmployeeManager";
import AircraftManager from "./pages/AircraftManager";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import HistoryExportPanel from "./pages/HistoryExportPanel";
import ConfigurationManager from "./pages/ConfigurationManager";
import NotFound from "./pages/NotFound";
import { setupPhotoAutoSync } from "@/lib/photo-evidence-service";
import { setupIntelligentSync } from "@/lib/intelligent-sync-service";

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error; errorInfo?: ErrorInfo }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-aviation-gradient flex items-center justify-center px-4">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-lg text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Algo deu errado
            </h2>
            <p className="text-white/80 mb-4">
              Ocorreu um erro inesperado. Você pode tentar novamente ou
              recarregar a página.
            </p>
            <div className="space-y-2">
              <button
                onClick={this.handleReset}
                className="bg-aviation-blue-600 hover:bg-aviation-blue-700 text-white px-6 py-2 rounded-lg transition-colors mr-2"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Recarregar Página
              </button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-white/70 cursor-pointer text-sm">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre className="text-red-300 text-xs mt-2 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const queryClient = new QueryClient();

const AppContent = () => {
  useEffect(() => {
    let isMounted = true;
    let syncService: any = null;
    let photoCleanup: (() => void) | null = null;

    // Setup services asynchronously with error handling
    const initializeServices = async () => {
      try {
        if (isMounted) {
          // Setup intelligent sync service
          syncService = setupIntelligentSync();

          // Setup photo evidence auto-sync
          photoCleanup = setupPhotoAutoSync();
        }
      } catch (error) {
        console.error("Error initializing services:", error);
      }
    };

    initializeServices();

    return () => {
      isMounted = false;

      // Clean up services with error handling
      try {
        if (photoCleanup && typeof photoCleanup === "function") {
          photoCleanup();
        }
      } catch (error) {
        console.warn("Error during photo cleanup:", error);
      }

      try {
        if (syncService && typeof syncService.destroy === "function") {
          syncService.destroy();
        }
      } catch (error) {
        console.warn("Error during sync service cleanup:", error);
      }
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cleaning-forms"
          element={
            <ProtectedRoute>
              <CleaningForms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-manager"
          element={
            <ProtectedRoute>
              <EmployeeManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aircraft-manager"
          element={
            <ProtectedRoute>
              <AircraftManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-management"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history-export"
          element={
            <ProtectedRoute>
              <HistoryExportPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuration"
          element={
            <ProtectedRoute>
              <ConfigurationManager />
            </ProtectedRoute>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
