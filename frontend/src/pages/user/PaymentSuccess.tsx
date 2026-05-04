import { Link, useLocation } from "react-router-dom";
import { useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
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

export default function PaymentSuccess() {
  const location = useLocation();
  const confettiRef = useRef<ConfettiRef>(null);

  const params = new URLSearchParams(location.search);
  const amount = params.get("amount");
  const reference = params.get("reference");
  const date = params.get("date");
  const paymentMode = params.get("paymentMode");
  const donorNameRaw = params.get("donorName");
  const donorName = donorNameRaw
    ? decodeURIComponent(donorNameRaw.replace(/\+/g, " "))
    : null;

  return (
    <PublicPageLayout>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <Confetti
          ref={confettiRef}
          className="pointer-events-none absolute inset-0 z-0 size-full"
        />
        <div
          className={cn(
            gigglesPublicShell,
            "relative z-[1] flex flex-col items-center pb-14 pt-10 text-center lg:pt-14"
          )}
        >
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e8f5ee] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#006a3d]">
            Thank you
          </span>

          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e8f5ee] shadow-[0_8px_20px_rgba(0,106,61,0.12)]">
              <CheckCircle2
                className="h-9 w-9 text-[#006a3d]"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <div>
              <h1
                className={`${fontDisplay} text-[1.85rem] font-semibold tracking-[-0.02em] text-[#2d2f31] md:text-[2.25rem]`}
              >
                Payment successful
              </h1>
              <p
                className={`mt-2 max-w-xl text-[1.02rem] leading-relaxed md:text-[1.05rem] ${gigglesSurface.onSurfaceVariant}`}
                onMouseEnter={() => confettiRef.current?.fire({})}
              >
                Thank you for your donation
                {donorName ? `, ${donorName}` : ""}. Your support helps us keep
                spreading joy where it matters most.
              </p>
            </div>
          </div>

          <div className={cn(gigglesCard, "mt-10 w-full max-w-lg p-8 text-left lg:p-9")}>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#71757b]">
              Transaction details
            </p>
            <dl className="mt-6 space-y-4">
              <DetailRow
                label="Amount paid"
                value={amount ? `₹${Number(amount).toLocaleString("en-IN")}` : "—"}
              />
              <DetailRow
                label="Date & time"
                value={
                  date
                    ? new Date(date).toLocaleString()
                    : new Date().toLocaleString()
                }
              />
              <DetailRow label="Reference" value={reference ?? "—"} />
              {paymentMode ? (
                <DetailRow label="Payment mode" value={paymentMode} />
              ) : null}
            </dl>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/"
              className={cn(btnPrimaryGiggles, "inline-flex py-3.5 text-[0.9rem]")}
            >
              Return home
            </Link>
            <Link
              to="/dashboard"
              className={cn(
                btnSecondaryGiggles,
                "inline-flex items-center justify-center py-3.5 text-[0.9rem]"
              )}
            >
              Impact hub
            </Link>
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className={`flex flex-wrap items-baseline justify-between gap-2 border-b border-[#f0f0f3] pb-4 last:border-0 last:pb-0`}
    >
      <dt className={`text-[0.8rem] font-semibold text-[#71757b]`}>{label}</dt>
      <dd className="text-right text-[0.9rem] font-medium text-[#2d2f31]">
        {value}
      </dd>
    </div>
  );
}
