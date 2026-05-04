import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * OPTIMIZED: This component's original logic is redundant.
 * The backend now handles the status check and redirects to the final page.
 * This component should ideally be removed from your redirect flow.
 *
 * If it must be kept, this simplified version acts as a safety net. If a user
 * is somehow routed here, it redirects them to the backend for proper verification,
 * preventing a duplicate client-side API call.
 */
export default function PaymentStatus() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // The backend handles the redirect. This component's API call is no longer needed.
    // This logic is a fallback in case of misconfiguration.
    const params = new URLSearchParams(location.search);
    const merchantTransactionId = params.get("merchantTransactionId"); // Param from PhonePe

    if (merchantTransactionId) {
      // Redirect to the backend's verification endpoint to let it handle the logic correctly.
      window.location.href = `/api/check-donation-status?merchantTransactionId=${merchantTransactionId}`;
    } else {
      // If there's no transaction ID, we cannot proceed. Go to the homepage.
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <p className="text-lg">Verifying your payment, please wait...</p>
      <p className="text-sm text-gray-500 mt-2">You are being redirected.</p>
    </div>
  );
}
