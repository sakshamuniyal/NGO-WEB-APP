import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth, useAdminAuth } from "../context/authContext"; // Assuming correct relative path

interface ProtectedRouteProps {
  adminOnly?: boolean;
  children?: React.ReactNode;
}

const ProtectedRoutes: React.FC<ProtectedRouteProps> = ({
  adminOnly,
  children,
}) => {
  const { isLoggedIn, loading: userLoading } = useAuth(); // Destructure userLoading
  const { isAdminLoggedIn, adminLoading } = useAdminAuth(); // Destructure adminLoading

  // If it's an admin-only route:
  if (adminOnly) {
    if (adminLoading) {
      // ⭐ NEW: Wait for admin authentication status to finish loading ⭐
      // Render nothing or a loading spinner while checking
      return <div>Loading admin authentication...</div>;
    }
    // If loading is complete AND not logged in, then redirect
    if (!isAdminLoggedIn) {
      return <Navigate to="/admin/login" />;
    }
  } else {
    // If it's a regular user-protected route:
    if (userLoading) {
      // ⭐ NEW: Wait for user authentication status to finish loading ⭐
      return <div>Loading user authentication...</div>;
    }
    // If loading is complete AND not logged in, then redirect
    if (!isLoggedIn) {
      return <Navigate to="/login" />;
    }
  }

  // If authentication checks pass (or aren't required for the path), render the content
  return children ? children : <Outlet />;
};

export default ProtectedRoutes;
