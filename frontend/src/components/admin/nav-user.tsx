"use client";

import { LogOutIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { AdminWithRole } from "@/types";
import { useAdminAuth } from "@/context/authContext";
import { getInitialsFromName } from "@/lib/utils";

export function NavUser({ admin }: { admin: AdminWithRole | null }) {
  const { isMobile } = useSidebar();
  const { adminLogout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await adminLogout();
      navigate("/admin/login");
    } catch (error) {
      console.error("Failed to log out admin:", error);
    }
  };

  if (!admin) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Avatar className="h-8 w-8 rounded-lg grayscale">
              <AvatarFallback className="rounded-lg">?</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading user...</span>
              <span className="truncate text-xs text-muted-foreground"></span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const adminName = admin.name || admin.email || "Admin";
  const adminEmail = admin.email || "admin@example.com";
  const adminInitials = getInitialsFromName(
    undefined,
    undefined,
    admin.name,
    admin.email,
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {admin.avatar ? (
                  <AvatarImage src={admin.avatar} alt={adminName} />
                ) : null}
                <AvatarFallback className="rounded-lg bg-[#e8f5ee] text-xs font-bold text-[#006a3d]">
                  {adminInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{adminName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {adminEmail}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {admin.avatar ? (
                    <AvatarImage src={admin.avatar} alt={adminName} />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-[#e8f5ee] text-xs font-bold text-[#006a3d]">
                    {adminInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{adminName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {adminEmail}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOutIcon className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
