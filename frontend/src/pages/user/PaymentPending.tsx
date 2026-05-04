import { Link, useLocation } from "react-router-dom";
import { Clock } from "lucide-react";
import { PublicPageLayout } from "@/components/user/public-page-layout";
import {
  btnPrimaryGiggles,
  btnSecondaryGiggles,
  fontDisplay,
  gigglesCard,
  gigglesPublicShell,
  gigglesSurface,
} from "@/lib/giggles-classes";
import { cn } from "@/lib/utils";

export default function PaymentPending() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const reference = params.get("reference");
  const message =
    params.get("message") || "Your payment is currently being processed.";

  return (
    <PublicPageLayout>
      <div
        className={cn(
          gigglesPublicShell,
          "flex flex-col items-center pb-14 pt-10 text-center lg:pt-14"
        )}
      >
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fbeed4] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#755700]">
          In progress
        </span>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#fbeed4] shadow-[0_8px_20px_rgba(117,87,0,0.1)]">
            <Clock
              className="h-9 w-9 text-[#755700]"
              strokeWidth={1.75}
              aria-hidden
            />
          </div>
          <div>
            <h1
              className={`${fontDisplay} text-[1.85rem] font-semibold tracking-[-0.02em] text-[#2d2f31] md:text-[2.25rem]`}
            >
              Payment pending
            </h1>
            <p
              className={`mt-2 max-w-xl text-[1.02rem] leading-relaxed md:text-[1.05rem] ${gigglesSurface.onSurfaceVariant}`}
            >
              {message} We&apos;ll update you once the status is confirmed. Receipts
              usually appear in your hub after success.
            </p>
          </div>
        </div>

        {reference ? (
          <div className={cn(gigglesCard, "mt-10 w-full max-w-lg p-8 text-left lg:p-9")}>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#71757b]">
              Reference
            </p>
            <p className="mt-4 font-mono text-[0.95rem] font-medium text-[#2d2f31]">
              {reference}
            </p>
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/dashboard"
            className={cn(btnPrimaryGiggles, "inline-flex py-3.5 text-[0.9rem]")}
          >
            Go to impact hub
          </Link>
          <Link
            to="/"
            className={cn(
              btnSecondaryGiggles,
              "inline-flex items-center justify-center py-3.5 text-[0.9rem]"
            )}
          >
            Return home
          </Link>
        </div>
      </div>
    </PublicPageLayout>
  );
}
