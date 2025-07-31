import "./global.css";

import { Component, ErrorInfo, ReactNode, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
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
import NotFound from "./pages/NotFound";
import { setupPhotoAutoSync } from "@/lib/photo-evidence-service";
import { setupIntelligentSync } from "@/lib/intelligent-sync-service";

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
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
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-aviation-gradient flex items-center justify-center px-4">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-lg text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Algo deu errado
            </h2>
            <p className="text-white/80 mb-4">
              Ocorreu um erro inesperado. Por favor, recarregue a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-aviation-blue-600 hover:bg-aviation-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Recarregar Página
            </button>
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
    // Setup intelligent sync service
    const syncService = setupIntelligentSync();

    // Setup photo evidence auto-sync
    const photoCleanup = setupPhotoAutoSync();

    return () => {
      photoCleanup();
      syncService.destroy();
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

// Create root and render app
const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);
root.render(<App />);
