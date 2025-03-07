
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-refillia-blue"></div>
      </div>
    );
  }

  // If not authenticated, redirect to the login page
  if (!user) {
    toast({
      title: "Authentication required",
      description: "Please sign in to access this page",
      variant: "destructive",
    });
    
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If admin-only route and user is not an admin, redirect to home
  if (adminOnly && !isAdmin) {
    toast({
      title: "Access denied",
      description: "You don't have permission to access this page",
      variant: "destructive",
    });
    
    return <Navigate to="/" replace />;
  }

  // If authenticated and has proper permissions, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
