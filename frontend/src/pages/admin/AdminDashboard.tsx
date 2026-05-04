import React from "react";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { ChartAreaInteractive } from "@/components/admin/chart-area-interactive";
import { DonationTable } from "@/components/admin/DonationTable"; // ⭐ FIXED IMPORT PATH ⭐
import { AdminCaseTable } from "@/components/admin/AdminCaseTable";
import { SectionCards } from "@/components/admin/section-cards";
import { SiteHeader } from "@/components/admin/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { UserLookup } from '@/components/admin/UserLookup';
import { AdminTeamTable } from '@/components/admin/AdminTeamTable';
import { PdfReceiptGenerator } from '@/components/admin/PdfReceiptGenerator';

export default function NewAdminDashboard() {
  const [activeSection, setActiveSection] = React.useState("dashboard");

  const getHeaderTitle = (section: string) => {
    switch (section) {
      case "dashboard":
        return "Dashboard";
      case "cases":
        return "Cases";
      case "team":
        return "Team";
      case "user-lookup":
        return "User Lookup";
      case "pdf-receipt-generator":
        return "PDF Receipt Generator";
      default:
        return "Admin Panel";
    }
  };

  const currentTitle = getHeaderTitle(activeSection);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <div className="px-4 lg:px-6">
              <DonationTable />
            </div>
          </div>
        );
      case "cases":
        return (
          <div className="px-4 lg:px-6 py-4 md:py-6">
            <AdminCaseTable />
          </div>
        );
      case "team":
        return (
          <div className="px-4 lg:px-6 py-4 md:py-6">
            <AdminTeamTable />
          </div>
        );
      case "user-lookup":
        return (
          <div className="px-4 lg:px-6 py-4 md:py-6">
            <UserLookup />
          </div>
        );
      case "pdf-receipt-generator":
        return (
          <div className="px-4 lg:px-6 py-4 md:py-6">
            <PdfReceiptGenerator />
          </div>
        );
      default:
        return (
          <div className="text-center py-8">
            <p>Select a section from the sidebar.</p>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar
        variant="inset"
        activeSection={activeSection}
        onNavClick={setActiveSection}
      />
      <SidebarInset>
        <SiteHeader currentTitle={currentTitle} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {renderContent()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
