"use client";

import * as React from "react";
import { FileIcon, LayoutDashboardIcon, ListIcon, SearchIcon, UsersIcon } from "lucide-react";

import { NavMain } from "@/components/admin/nav-main";
import { NavUser } from "@/components/admin/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAdminAuth } from "@/context/authContext";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeSection: string; // Current active section string (e.g., "dashboard")
  onNavClick: (section: string) => void; // Callback to change active section
}

export function AppSidebar({
  activeSection,
  onNavClick,
  ...props
}: AppSidebarProps) {
  const { admin } = useAdminAuth();

  // Define navMain items with simple identifiers
  const navMainItems = [
    {
      title: "Dashboard",
      id: "dashboard", // Use an ID to identify the section
      icon: LayoutDashboardIcon,
    },
    {
      title: "Cases",
      id: "cases", // Use an ID to identify the section
      icon: ListIcon,
    },
    {
      title: "Team",
      id: "team", // Use an ID to identify the section
      icon: UsersIcon,
    },
    {
      title: "User Lookup",
      id: "user-lookup", // Use an ID to identify the section
      icon: SearchIcon,
    },
    {
      title: "PDF Receipt Generator",
      id: "pdf-receipt-generator", // Use an ID to identify the section
      icon: FileIcon,
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props} className="inset-y-20 pb-20">
      <SidebarHeader>
        <h2 className="font-medium pl-2 pb-4 border-gray-300 border-b-2">
          Admin Panel
        </h2>
      </SidebarHeader>

      <SidebarContent>
        {/* Pass activeSection and onNavClick to NavMain */}
        <NavMain
          items={navMainItems}
          activeSection={activeSection}
          onNavClick={onNavClick}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser admin={admin} />
      </SidebarFooter>
    </Sidebar>
  );
}
