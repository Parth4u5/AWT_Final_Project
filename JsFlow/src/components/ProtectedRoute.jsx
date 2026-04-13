import { Navigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../utils/auth";

const ProtectedRoute = ({ children, adminOnly = false }) => {
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