import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE_URL;

export type DashboardPaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface DashboardDonation {
  id: string;
  amount: number;
  currency: string;
  paymentMode: "CASH" | "CARD" | "UPI" | "NETBANKING" | "OTHER";
  paymentStatus: DashboardPaymentStatus;
  transactionId: string;
  gatewayTransactionId?: string | null;
  timeOfPayment: string;
  isAnonymous: boolean;
  case?: { id: string; patientName: string; typeOfCase: string } | null;
  receipt?: {
    id: string;
    donationId: string;
    fileUrl: string;
    receiptNo: string | null;
    createdAt: string;
  } | null;
}

export interface PaginatedDonationsResponse {
  donations: DashboardDonation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UsePaginatedUserDonationsArgs {
  enabled: boolean;
  page: number;
  limit?: number;
  paymentStatus?: DashboardPaymentStatus;
}

export function usePaginatedUserDonations({
  enabled,
  page,
  limit = 10,
  paymentStatus,
}: UsePaginatedUserDonationsArgs) {
  const [data, setData] = useState<PaginatedDonationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<PaginatedDonationsResponse>(`${apiBase}/api/donations`, {
        params: { page, limit, ...(paymentStatus ? { paymentStatus } : {}) },
        withCredentials: true,
      });
      setData(res.data);
    } catch (err: unknown) {
      console.error("usePaginatedUserDonations", err);
      setError("Failed to load donations.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, page, limit, paymentStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    donations: data?.donations ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    loading,
    error,
    refetch: load,
  };
}
