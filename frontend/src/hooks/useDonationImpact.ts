import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE_URL;

export interface DonationImpactResponse {
  totals: {
    totalAmount: number;
    successfulCount: number;
    uniqueCasesSupported: number;
    thisYearAmount: number;
  };
  monthlyBreakdown: { month: string; amount: number }[];
  recentImpact: Array<{
    id: string;
    amount: number;
    currency: string;
    paymentMode: string;
    timeOfPayment: string;
    case: { id: string; patientName: string; typeOfCase: string } | null;
  }>;
}

export function useDonationImpact(enabled: boolean) {
  const [data, setData] = useState<DonationImpactResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImpact = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<DonationImpactResponse>(`${apiBase}/api/donations/impact`, {
        withCredentials: true,
      });
      setData(res.data);
    } catch (err: unknown) {
      console.error("useDonationImpact", err);
      setError("Failed to load impact summary.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void fetchImpact();
  }, [fetchImpact]);

  return { data, loading, error, refetch: fetchImpact };
}
