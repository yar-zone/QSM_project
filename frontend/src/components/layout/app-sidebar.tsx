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
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <BookOpen className="h-4 w-4" />
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-display text-base font-bold leading-none">Nur Quran</p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {primaryRole ? ROLE_LABELS[primaryRole] : "Member"}
            </p>
          </div>
        </div>
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
