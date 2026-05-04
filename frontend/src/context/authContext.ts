// src/context/authContext.ts
import { createContext, useContext  } from 'react';
import { AdminWithRole, User } from '../types';

// Auth Context Types
export interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  refetchAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean; // Optional, if needed for user roles
  logout: () => Promise<void>;
  login: (user: User) => Promise<void>;
}

export interface AuthContextTypeAdmin {
  isAdminLoggedIn: boolean;
  admin: AdminWithRole | null;
  adminLoading: boolean;
  refetchAdminAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  adminLogin: (email: string, password: string) => Promise<void>
  adminLogout: () => Promise<void>;
}

// Auth Contexts
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthContextAdmin = createContext<AuthContextTypeAdmin | undefined>(undefined);

// Auth Hooks
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const useAdminAuth = () => {
  const context = useContext(AuthContextAdmin);
  if (!context) throw new Error('useAdminAuth must be used within an AuthProvider');
  return context;
};