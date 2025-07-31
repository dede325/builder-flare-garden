import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
  role?: string;
  minimumLevel?: number;
}

export default function ProtectedRoute({
  children,
  permission,
  role,
  minimumLevel,
}: ProtectedRouteProps) {
  const {
    user,
    loading,
    initialized,
    hasPermission,
    hasRole,
    hasMinimumRoleLevel,
  } = useAuth();

  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-aviation-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check permission-based access
  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen bg-aviation-gradient flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
          <p className="mb-4">Não tem permissão para aceder a esta página.</p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  // Check role-based access
  if (role && !hasRole(role)) {
    return (
      <div className="min-h-screen bg-aviation-gradient flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
          <p className="mb-4">Esta página requer a role: {role}.</p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  // Check level-based access
  if (minimumLevel && !hasMinimumRoleLevel(minimumLevel)) {
    return (
      <div className="min-h-screen bg-aviation-gradient flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
          <p className="mb-4">Esta página requer privilégios elevados.</p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
