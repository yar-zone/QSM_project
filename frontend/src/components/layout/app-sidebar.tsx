import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { navForRole } from "@/lib/nav";
import { ROLE_LABELS } from "@/lib/roles";

export function AppSidebar() {
  const { primaryRole } = useAuth();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const items = navForRole(primaryRole);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white shadow-sm">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-display text-base font-bold leading-none text-sidebar-foreground">Nur Quran</p>
            <p className="mt-0.5 truncate text-xs text-sidebar-foreground/60">
              {primaryRole ? ROLE_LABELS[primaryRole] : "Member"}
            </p>
          </div>
        </div>
        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  currentPath === item.to || currentPath.startsWith(item.to + "/");
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.to} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
