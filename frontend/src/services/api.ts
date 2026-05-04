// src/services/api.ts
import axios, { AxiosResponse } from 'axios';
import { Case, Donation } from '../types';


export const api = axios.create({
  baseURL: import.meta.env.VITE_ENV === 'production' ? import.meta.env.VITE_API_BASE_URL : import.meta.env.VITE_API_BASE_URL_DEV, 
  withCredentials: true,
});

export const createCase = async (data: Partial<Case>): Promise<Case> => {
  const response: AxiosResponse<Case> = await api.post('/admin/cases', data);
  return response.data;
};

export const getDonations = async (filters?: {
  caseId?: string;
  paymentStatus?: 'PENDING' | 'SUCCESS' | 'FAILED';
}): Promise<Donation[]> => {
  const response: AxiosResponse<Donation[]> = await api.get('/admin/donations', {
    params: filters,
  });
  return response.data;
};

export const lookupUser = async (params: { name?: string; phoneNumber?: string; id?: string }) => {
  const response = await api.get('/admin/users/lookup', { params });
  return response.data;
};

export const getAllAdmins = async () => {
  const response = await api.get('/admin/admins');
  return response.data;
};

export const createAdmin = async (data: { name: string; email: string; password: string; roleId: string }) => {
  const response = await api.post('/admin/admins', data);
  return response.data;
};

export const updateAdminRole = async (adminId: string, roleId: string) => {
  const response = await api.put('/admin/admins/role', { adminId, roleId });
  return response.data;
};

export const getAllRolesAndPermissions = async () => {
  const response = await api.get('/admin/roles-permissions');
  return response.data;
};

export const updateAdminPermissions = async (adminId: string, roleId: string, permissionIds: string[]) => {
  const response = await api.put('/admin/admins/permissions', { adminId, roleId, permissionIds });
  return response.data;
};

export const deleteAdmin = async (adminId: string) => {
  const response = await api.delete('/admin/admins', { data: { adminId } });
  return response.data;
};

export type GalleryItem = { key: string; url: string };

export const fetchGalleryImages = async (): Promise<GalleryItem[]> => {
  const response = await api.get<{ items: GalleryItem[] }>('/api/gallery');
  return response.data.items ?? [];
};

export const manualReceipt = async (data: {
  firstName: string;
  lastName?: string;
  title: string;
  address?: { line1: string; line2?: string; state: string; country: string; zipCode: string };
  phoneNumber?: string;
  pan?: string;
  modeOfPayment: string;
  amount: number;
  createdAt: string;
  email: string;
}) => {
  const response = await api.post('/admin/receipts/manual', data);
  return response.data;
};