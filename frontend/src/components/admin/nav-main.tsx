"use client";

import { type LucideIcon } from "lucide-react";
// Removed Link import as we are no longer using react-router-dom for this internal navigation

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
  activeSection, // Current active section string
  onNavClick, // Callback function to change active section
}: {
  items: {
    title: string;
    id: string; // Now using 'id' for internal section identification
    icon?: LucideIcon;
  }[];
  activeSection: string;
  onNavClick: (section: string) => void;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {/* Removed Quick Create and Mail button sections */}
          {items.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                // Use a standard button with onClick
                onClick={() => onNavClick(item.id)}
                tooltip={item.title}
                className={
                  activeSection === item.id // Check if current section matches item's ID
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" // Active state styles
                    : ""
                }
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
