import React, { ReactNode } from "react";
import {
  AuthContext,
  AuthContextAdmin,
  AuthContextType,
  AuthContextTypeAdmin,
} from "./authContext"; // Assuming authContext is in the same directory
import { AdminWithRole, User } from "../types"; // Assuming types are in '../types'
import { api } from "../services/api"; // Assuming api is in '../services/api'

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refetchAuth = React.useCallback(async () => {
    setLoading(true);
    try {
      console.log(
        "Fetching auth status from:",
        `${api.defaults.baseURL}/api/auth/status`
      );
      const response = await api.get("/api/auth/status", {
        withCredentials: true,
      });
      if (response.data.isLoggedIn && response.data.user) {
        setUser(response.data.user);
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Failed to fetch auth status:", error);
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (user: User): Promise<void> => {
    setLoading(true);
    try {
      setUser(user);
      setIsLoggedIn(true);
      // No API call here since verification is handled by /verify-otp
    } catch (error) {
      console.error("Login failed:", error);
      setUser(null);
      setIsLoggedIn(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await api.post("api/auth/logout", {}, { withCredentials: true }); // Adjust endpoint
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const authContextValue: AuthContextType = {
    isLoggedIn,
    user,
    loading,
    refetchAuth,
    hasPermission: () => false, // Placeholder, usually for admin
    logout,
    login,
  };

  React.useEffect(() => {
    refetchAuth();
  }, [refetchAuth]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = React.useState(false);
  const [admin, setAdmin] = React.useState<AdminWithRole | null>(null);
  const [adminLoading, setAdminLoading] = React.useState(true);

  const refetchAdminAuth = React.useCallback(async () => {
    setAdminLoading(true);
    try {
      console.log(
        "Fetching auth status from:",
        `${api.defaults.baseURL}/api/admin/auth/status`
      );
      // ⭐ CORRECTED ADMIN STATUS ENDPOINT ⭐
      const response = await api.get("/api/admin/auth/status", {
        withCredentials: true,
      });
      if (response.data.isLoggedIn && response.data.admin) {
        setAdmin(response.data.admin as AdminWithRole);
        setIsAdminLoggedIn(true);
      } else {
        setAdmin(null);
        setIsAdminLoggedIn(false);
      }
    } catch (error) {
      console.error("Failed to fetch admin auth status:", error);
      setAdmin(null);
      setIsAdminLoggedIn(false);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  const hasPermission = (permission: string): boolean => {
    return admin?.role.permissions.some((p: { name: string }) => p.name === permission) || false;
  };

  const adminLogin = async (email: string, password: string): Promise<void> => {
    setAdminLoading(true);
    try {
      // ⭐ ADMIN LOGIN ENDPOINT IS ALREADY CORRECT ⭐

      const response = await api.post(
        "/api/admin/login",
        { email, password },
        { withCredentials: true }
      );
      if (response.data.admin) {
        setAdmin(response.data.admin as AdminWithRole);
        setIsAdminLoggedIn(true);
      }
    } catch (error) {
      console.error("Admin login failed:", error);
      setAdmin(null);
      setIsAdminLoggedIn(false);
      throw error;
    } finally {
      setAdminLoading(false);
    }
  };

  const adminLogout = async (): Promise<void> => {
    setAdminLoading(true);
    try {
      await api.post("/api/admin/logout", {}, { withCredentials: true });
      setAdmin(null);
      setIsAdminLoggedIn(false);
    } catch (error) {
      console.error("Admin Logout failed", error);
      throw error;
    } finally {
      setAdminLoading(false);
    }
  };

  const adminContextValue: AuthContextTypeAdmin = {
    isAdminLoggedIn,
    admin,
    adminLoading,
    refetchAdminAuth,
    hasPermission,
    adminLogin,
    adminLogout,
  };

  React.useEffect(() => {
    refetchAdminAuth();
  }, [refetchAdminAuth]);

  return (
    <AuthContextAdmin.Provider value={adminContextValue}>
      {children}
    </AuthContextAdmin.Provider>
  );
};
