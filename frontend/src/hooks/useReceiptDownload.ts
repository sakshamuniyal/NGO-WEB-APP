import axios from "axios";
import { useCallback, useState } from "react";

const apiBase = import.meta.env.VITE_API_BASE_URL;

export function useReceiptDownload() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadReceipt = useCallback(async (donationId: string): Promise<{ ok: true } | { ok: false; message: string }> => {
    setDownloadingId(donationId);
    try {
      const { data } = await axios.get<{ downloadUrl: string }>(
        `${apiBase}/api/donations/${donationId}/receipt`,
        { withCredentials: true }
      );
      window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
      return { ok: true };
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        const msg = (err.response.data as { message?: string }).message;
        if (msg) return { ok: false, message: msg };
      }
      return { ok: false, message: "Could not download receipt. Please try again later." };
    } finally {
      setDownloadingId(null);
    }
  }, []);

  return { downloadReceipt, downloadingId };
}
