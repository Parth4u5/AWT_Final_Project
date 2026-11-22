import type { ReactNode } from "react";
import { Navigate } from "react-router";

import { getCurrentUser, isAuthenticated } from "../utils/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({
  children,
  adminOnly = false,
}: ProtectedRouteProps) => {
  const user = getCurrentUser();
  const authenticated = isAuthenticated();

  if (!user || !authenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
