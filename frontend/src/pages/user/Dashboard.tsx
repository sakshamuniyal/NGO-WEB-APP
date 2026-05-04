import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/authContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3Icon,
  FileTextIcon,
  LayoutDashboardIcon,
  ReceiptIcon,
  SettingsIcon,
} from "lucide-react";
import { useDonationImpact } from "@/hooks/useDonationImpact";
import { usePaginatedUserDonations } from "@/hooks/usePaginatedUserDonations";
import { useReceiptDownload } from "@/hooks/useReceiptDownload";
import { PublicPageLayout } from "@/components/user/public-page-layout";
import { gigglesPublicShell } from "@/lib/giggles-classes";

type Section = "dashboard" | "donations" | "receipts" | "reports" | "settings";

const SECTIONS: readonly Section[] = [
  "dashboard",
  "donations",
  "receipts",
  "reports",
  "settings",
] as const;

function parseTab(param: string | null): Section {
  if (param && (SECTIONS as readonly string[]).includes(param)) {
    return param as Section;
  }
  return "dashboard";
}

/** Giggles design system tokens (frontend/Design.md) */
const gigglesSurface = {
  base: "bg-[#f6f6f9]",
  onSurfaceVariant: "text-[#5a5c5e]",
  containerLow: "bg-[#f0f0f3]",
};
const gigglesCard =
  "rounded-[2rem] border-0 bg-white text-[#2d2f31] shadow-[0_20px_40px_rgba(45,47,49,0.06)]";
const gigglesLayerRow = "rounded-2xl bg-[#f0f0f3] px-4 py-4";
const btnPrimaryGiggles =
  "rounded-full border-0 bg-gradient-to-br from-[#006a3d] via-[#006a3d] to-[#6ef9aa] text-white shadow-[0_20px_40px_rgba(45,47,49,0.06)] hover:opacity-[0.94]";
const btnSecondaryGiggles =
  "rounded-full border-0 bg-[#dbdde0] text-[#2d2f31] hover:bg-[#d0d2d6] shadow-none";
const fontBody = "font-['Manrope',system-ui,sans-serif]";
const fontDisplay = "font-['Plus_Jakarta_Sans',system-ui,sans-serif]";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeSection, setActiveSection] = useState<Section>(() =>
    parseTab(searchParams.get("tab"))
  );
  const [donationsPage, setDonationsPage] = useState(1);
  const [receiptsPage, setReceiptsPage] = useState(1);
  const [receiptActionMessage, setReceiptActionMessage] = useState<string | null>(null);

  const goToSection = (key: Section) => {
    if (key === "donations") setDonationsPage(1);
    if (key === "receipts") setReceiptsPage(1);
    setActiveSection(key);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", key);
        return next;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    setActiveSection(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  const { data: impact, loading: impactLoading, error: impactError } = useDonationImpact(
    Boolean(user)
  );

  const donationsQuery = usePaginatedUserDonations({
    enabled: activeSection === "donations" && Boolean(user),
    page: donationsPage,
    limit: 10,
  });

  const receiptsQuery = usePaginatedUserDonations({
    enabled: activeSection === "receipts" && Boolean(user),
    page: receiptsPage,
    limit: 10,
    paymentStatus: "SUCCESS",
  });

  const { downloadReceipt, downloadingId } = useReceiptDownload();

  const handleEditProfile = () => {
    navigate("/complete-profile");
  };

  const impactStats = impact?.totals;
  const recentImpact = impact?.recentImpact ?? [];
  const monthlyBreakdown = impact?.monthlyBreakdown ?? [];

  const sectionItems = useMemo(
    () =>
      [
        { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboardIcon },
        { key: "donations" as const, label: "My Donations", icon: ReceiptIcon },
        { key: "receipts" as const, label: "Tax Receipts", icon: FileTextIcon },
        { key: "reports" as const, label: "Impact Reports", icon: BarChart3Icon },
        { key: "settings" as const, label: "Settings", icon: SettingsIcon },
      ] as const,
    []
  );

  if (authLoading) {
    return (
      <PublicPageLayout>
        <div
          className={`flex min-h-[40vh] flex-col items-center justify-center py-16 ${gigglesSurface.onSurfaceVariant}`}
        >
          <p className="text-[#2d2f31]">Loading dashboard...</p>
        </div>
      </PublicPageLayout>
    );
  }

  if (!user) {
    return (
      <PublicPageLayout>
        <div
          className={`flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 py-16`}
        >
          <p className="text-[#2d2f31]">User data not found. Redirecting to login...</p>
          <Button className={btnPrimaryGiggles} onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </div>
      </PublicPageLayout>
    );
  }

  const renderMainContent = () => {
    if (activeSection === "donations") {
      if (donationsQuery.loading) {
        return (
          <div className={`py-12 text-center ${gigglesSurface.onSurfaceVariant}`}>
            Loading donations…
          </div>
        );
      }
      if (donationsQuery.error) {
        return (
          <div className="py-12 text-center text-[#b7004d]">{donationsQuery.error}</div>
        );
      }

      const { donations, total, page, limit, totalPages } = donationsQuery;
      const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
      const rangeEnd = Math.min(page * limit, total);

      return (
        <Card className={gigglesCard}>
          <CardHeader>
            <CardTitle className={`${fontDisplay} text-xl tracking-tight`}>My Donations</CardTitle>
            <CardDescription className={gigglesSurface.onSurfaceVariant}>
              Newest first — all donation attempts linked to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-[2rem]">
            {donations.length === 0 ? (
              <p className={`text-sm ${gigglesSurface.onSurfaceVariant}`}>No donations yet.</p>
            ) : (
              <>
                <p className={`text-[0.75rem] uppercase tracking-widest ${gigglesSurface.onSurfaceVariant}`}>
                  Showing {rangeStart}–{rangeEnd} of {total}
                </p>
                <div className="space-y-6">
                  {donations.map((donation) => (
                    <div
                      key={donation.id}
                      className={`flex flex-wrap items-center justify-between gap-4 ${gigglesLayerRow}`}
                    >
                      <div>
                        <p className="font-medium">
                          {donation.case
                            ? `${donation.case.patientName} (${donation.case.typeOfCase})`
                            : "General Donation"}
                        </p>
                        <p className={`text-xs ${gigglesSurface.onSurfaceVariant}`}>
                          {new Date(donation.timeOfPayment).toLocaleString()} •{" "}
                          {donation.paymentMode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {donation.currency}{" "}
                          {Number(donation.amount).toLocaleString("en-IN")}
                        </p>
                        <Badge
                          variant={
                            donation.paymentStatus === "SUCCESS"
                              ? "default"
                              : donation.paymentStatus === "PENDING"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {donation.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className={btnSecondaryGiggles}
                      disabled={page <= 1}
                      onClick={() => setDonationsPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className={`text-sm ${gigglesSurface.onSurfaceVariant}`}>
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className={btnSecondaryGiggles}
                      disabled={page >= totalPages}
                      onClick={() => setDonationsPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      );
    }

    if (activeSection === "receipts") {
      if (receiptsQuery.loading) {
        return (
          <div className={`py-12 text-center ${gigglesSurface.onSurfaceVariant}`}>
            Loading receipts…
          </div>
        );
      }
      if (receiptsQuery.error) {
        return (
          <div className="py-12 text-center text-[#b7004d]">{receiptsQuery.error}</div>
        );
      }

      const { donations: receiptRows, total, page, limit, totalPages } = receiptsQuery;
      const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
      const rangeEnd = Math.min(page * limit, total);

      return (
        <Card className={gigglesCard}>
          <CardHeader>
            <CardTitle className={`${fontDisplay} text-xl tracking-tight`}>Tax Receipts</CardTitle>
            <CardDescription className={gigglesSurface.onSurfaceVariant}>
              Download receipts for successful donations (generated automatically after payment)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-[2rem]">
            {receiptActionMessage ? (
              <p className={`text-sm ${gigglesSurface.onSurfaceVariant}`}>{receiptActionMessage}</p>
            ) : null}
            {receiptRows.length === 0 ? (
              <p className={`text-sm ${gigglesSurface.onSurfaceVariant}`}>
                No successful donations yet. Receipts appear here after payment succeeds.
              </p>
            ) : (
              <>
                <p className={`text-[0.75rem] uppercase tracking-widest ${gigglesSurface.onSurfaceVariant}`}>
                  Showing {rangeStart}–{rangeEnd} of {total}
                </p>
                <div className="space-y-6">
                  {receiptRows.map((donation) => (
                    <div
                      key={donation.id}
                      className={`flex flex-wrap items-center justify-between gap-4 ${gigglesLayerRow}`}
                    >
                      <div>
                        <p className="font-medium">
                          {donation.receipt?.receiptNo ?? donation.transactionId}
                        </p>
                        <p className={`text-xs ${gigglesSurface.onSurfaceVariant}`}>
                          {new Date(donation.timeOfPayment).toLocaleDateString()} •{" "}
                          {donation.currency}{" "}
                          {Number(donation.amount).toLocaleString("en-IN")}
                        </p>
                      </div>
                      {donation.receipt?.fileUrl ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className={btnSecondaryGiggles}
                          disabled={downloadingId === donation.id}
                          onClick={async () => {
                            setReceiptActionMessage(null);
                            const result = await downloadReceipt(donation.id);
                            if (!result.ok) {
                              setReceiptActionMessage(result.message);
                            }
                          }}
                        >
                          {downloadingId === donation.id ? "Opening…" : "Download PDF"}
                        </Button>
                      ) : (
                        <span
                          className={`text-xs ${gigglesSurface.onSurfaceVariant} max-w-[10rem] text-right`}
                        >
                          Receipt generating — refresh in a minute
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {totalPages > 1 ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className={btnSecondaryGiggles}
                      disabled={page <= 1}
                      onClick={() => setReceiptsPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className={`text-sm ${gigglesSurface.onSurfaceVariant}`}>
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className={btnSecondaryGiggles}
                      disabled={page >= totalPages}
                      onClick={() => setReceiptsPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      );
    }

    if (activeSection === "reports") {
      if (impactLoading) {
        return (
          <div className={`py-12 text-center ${gigglesSurface.onSurfaceVariant}`}>
            Loading report data…
          </div>
        );
      }
      if (impactError) {
        return (
          <div className={`py-12 text-center text-[#b7004d]`}>{impactError}</div>
        );
      }

      return (
        <Card className={gigglesCard}>
          <CardHeader>
            <CardTitle className={`${fontDisplay} text-xl tracking-tight`}>Impact Reports</CardTitle>
            <CardDescription className={gigglesSurface.onSurfaceVariant}>
              Monthly snapshot of your contribution trend
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {monthlyBreakdown.length === 0 ? (
              <p className={`text-sm ${gigglesSurface.onSurfaceVariant}`}>
                No successful donations available to build a report.
              </p>
            ) : (
              monthlyBreakdown.map((item) => (
                <div key={item.month} className="space-y-3">
                  <div
                    className={`flex items-center justify-between text-sm ${gigglesSurface.onSurfaceVariant}`}
                  >
                    <span>{item.month}</span>
                    <span className="font-semibold tabular-nums text-[#2d2f31]">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className={`h-2 rounded-full ${gigglesSurface.containerLow}`}>
                    <div
                      className="h-2 rounded-full bg-[#006a3d]"
                      style={{
                        width: `${Math.max(
                          8,
                          (item.amount /
                            Math.max(...monthlyBreakdown.map((m) => m.amount), 1)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      );
    }

    if (activeSection === "settings") {
      return (
        <Card className={gigglesCard}>
          <CardHeader>
            <CardTitle className={`${fontDisplay} text-xl tracking-tight`}>Settings</CardTitle>
            <CardDescription className={gigglesSurface.onSurfaceVariant}>
              Manage your profile and account details
            </CardDescription>
          </CardHeader>
          <CardContent className={`space-y-4 text-sm ${gigglesSurface.onSurfaceVariant}`}>
            <p className="text-[#2d2f31]">
              <span className="font-semibold text-[#2d2f31]">Name:</span>{" "}
              {user.firstName || "Not provided"} {user.lastName || ""}
            </p>
            <p>
              <span className="font-semibold text-[#2d2f31]">Email:</span>{" "}
              {user.email || "Not provided"}
            </p>
            <p>
              <span className="font-semibold text-[#2d2f31]">Phone:</span> {user.phoneNumber}
            </p>
            <p>
              <span className="font-semibold text-[#2d2f31]">PAN:</span>{" "}
              {user.panCard || "Not provided"}
            </p>
            <Button onClick={handleEditProfile} className={`mt-2 ${btnPrimaryGiggles}`}>
              Edit Profile
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (impactLoading) {
      return (
        <div className={`py-12 text-center ${gigglesSurface.onSurfaceVariant}`}>
          Loading your impact data…
        </div>
      );
    }
    if (impactError) {
      return (
        <div className={`py-12 text-center text-[#b7004d]`}>{impactError}</div>
      );
    }

    if (!impactStats) {
      return (
        <div className={`py-12 text-center ${gigglesSurface.onSurfaceVariant}`}>
          No impact data yet.
        </div>
      );
    }

    return (
      <>
        <div className="grid gap-8 md:grid-cols-3">
          <Card className={`md:col-span-2 ${gigglesCard}`}>
            <CardHeader className="space-y-4">
              <CardDescription className={`${gigglesSurface.onSurfaceVariant} uppercase tracking-[0.05em] text-[0.75rem]`}>
                Total contribution
              </CardDescription>
              <CardTitle
                className={`${fontDisplay} text-4xl font-semibold tabular-nums tracking-tight text-[#2d2f31]`}
              >
                ₹{impactStats.totalAmount.toLocaleString("en-IN")}
              </CardTitle>
            </CardHeader>
            <CardContent className={`grid gap-8 text-sm ${gigglesSurface.onSurfaceVariant} sm:grid-cols-3`}>
              <div>
                <p className="font-semibold tabular-nums text-[#2d2f31]">
                  {impactStats.successfulCount}
                </p>
                <p>successful donations</p>
              </div>
              <div>
                <p className="font-semibold tabular-nums text-[#2d2f31]">
                  {impactStats.uniqueCasesSupported}
                </p>
                <p>causes supported</p>
              </div>
              <div>
                <p className="font-semibold tabular-nums text-[#2d2f31]">
                  ₹{impactStats.thisYearAmount.toLocaleString("en-IN")}
                </p>
                <p>this year</p>
              </div>
            </CardContent>
          </Card>

          <Card className={gigglesCard}>
            <CardHeader>
              <CardDescription className={`text-[0.75rem] font-semibold uppercase tracking-[0.05em] text-[#755700]`}>
                Impact level
              </CardDescription>
              <CardTitle
                className={`${fontDisplay} text-5xl font-semibold tracking-tight text-[#2d2f31]`}
              >
                {Math.max(1, Math.floor(impactStats.successfulCount / 3) + 1)}
              </CardTitle>
            </CardHeader>
            <CardContent className={`${gigglesSurface.onSurfaceVariant}`}>
              You have helped multiple families access critical support.
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <Card className={`lg:col-span-2 ${gigglesCard}`}>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
              <div className="space-y-3">
                <CardTitle className={`${fontDisplay} text-xl tracking-tight`}>
                  Recent Impact
                </CardTitle>
                <CardDescription className={gigglesSurface.onSurfaceVariant}>
                  Your latest successful donations
                </CardDescription>
              </div>
              <button
                type="button"
                className={`text-sm font-semibold text-[#006a3d] underline-offset-4 transition-colors hover:text-[#005632] hover:underline`}
                onClick={() => navigate("/donate")}
              >
                Give Again
              </button>
            </CardHeader>
            <CardContent className="space-y-6">
              {recentImpact.length === 0 ? (
                <p className={`text-sm ${gigglesSurface.onSurfaceVariant}`}>
                  No successful donations yet. Make your first impact today.
                </p>
              ) : (
                recentImpact.map((donation) => (
                  <div
                    key={donation.id}
                    className={`flex items-center justify-between gap-4 ${gigglesLayerRow}`}
                  >
                    <div>
                      <p className="font-medium">
                        {donation.case ? donation.case.patientName : "General Donation"}
                      </p>
                      <p className={`text-xs ${gigglesSurface.onSurfaceVariant}`}>
                        {new Date(donation.timeOfPayment).toLocaleDateString()} •{" "}
                        {donation.paymentMode}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums text-[#2d2f31]">
                      {donation.currency}{" "}
                      {Number(donation.amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className={gigglesCard}>
            <CardHeader className="space-y-4">
              <CardDescription className={`text-[0.75rem] font-semibold uppercase tracking-[0.05em] text-[#755700]`}>
                Impact highlight
              </CardDescription>
              <CardTitle
                className={`${fontDisplay} text-2xl font-semibold leading-snug tracking-tight text-[#2d2f31]`}
              >
                Explore your{" "}
                <span className="text-[#755700]">annual impact snapshot</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                onClick={() => goToSection("reports")}
                className={`h-auto px-6 py-2.5 text-base ${btnPrimaryGiggles}`}
              >
                View Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  };

  return (
    <PublicPageLayout>
      <div className={`${gigglesPublicShell} py-12 md:py-14 ${fontBody}`}>
        <header className="mb-14 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl space-y-4">
          <Badge className="mb-2 rounded-full border-0 bg-[#ffca4d] px-4 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.05em] text-[#755700] hover:bg-[#ffca4d]">
            Your impact hub
          </Badge>
          <h1
            className={`${fontDisplay} -tracking-[0.02em] text-4xl font-semibold leading-tight text-[#2d2f31] md:text-[2rem] md:leading-snug lg:text-[2.125rem]`}
          >
            Welcome back, {user.firstName || "Impact Member"}
          </h1>
          <p className={`text-[1rem] leading-relaxed ${gigglesSurface.onSurfaceVariant}`}>
            Every contribution creates smiles. Track your contribution journey in one place.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            type="button"
            className={`px-8 ${btnPrimaryGiggles}`}
            onClick={() => navigate("/donate")}
          >
            Donate Now
          </Button>
        </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <Card className={`h-fit ${gigglesCard}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`${fontDisplay} text-lg tracking-tight`}>Member Panel</CardTitle>
            <CardDescription className={gigglesSurface.onSurfaceVariant}>
              Track and manage your impact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-[0.625rem]">
            {sectionItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.key;
              return (
                <Button
                  key={item.key}
                  type="button"
                  variant="ghost"
                  className={`w-full justify-start gap-2 rounded-full px-4 ${
                    isActive
                      ? `${btnPrimaryGiggles} justify-start hover:opacity-[0.94]`
                      : `text-[#2d2f31] hover:bg-[#f0f0f3]`
                  }`}
                  onClick={() => goToSection(item.key)}
                >
                  <Icon className="h-4 w-4 stroke-[1.5]" />
                  {item.label}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <div>{renderMainContent()}</div>
        </div>
      </div>
    </PublicPageLayout>
  );
};

export default Dashboard;
