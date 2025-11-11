"use client";

import * as React from "react";
import { ChevronsUpDown, LayoutDashboard, Plus, Square } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { useCabang } from "@/hooks/useCabang";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
}) {
  const { isMobile } = useSidebar();
  const { activeCabangId, setActiveCabangId } = useGlobalCabangStore();
  const { data: dataCabang } = useCabang();
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);

  if (!activeTeam) {
    return null;
  }
  if (!activeCabangId) {
    return null;
  }

  // console.log("Active Cabang ID: ", activeCabangId);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeCabangId}</span>
                <span className="truncate text-xs">{}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Switch Branch
            </DropdownMenuLabel>

            {/* {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <team.logo className="size-3.5 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))} */}
            <DropdownMenuItem
              onClick={() => setActiveCabangId("ALL")}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-md border">
                <Square className="size-3.5 shrink-0" />
              </div>
              All Branches
              {/* <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut> */}
            </DropdownMenuItem>
            {dataCabang?.map((cabang, index) => (
              <DropdownMenuItem
                key={cabang.id}
                onClick={() => setActiveCabangId(cabang.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <LayoutDashboard className="size-3.5 shrink-0" />
                </div>
                {cabang.namaCabang}
                {/* <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut> */}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
