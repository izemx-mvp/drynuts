import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Factory,
  Handshake,
  Truck,
  Settings as SettingsIcon,
  LogOut,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationBell } from "@/components/NotificationBell";
import { GlobalSearch } from "@/components/GlobalSearch";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/production", label: "Production", icon: Factory },
  { to: "/commercial", label: "Commercial", icon: Handshake },
  { to: "/partners", label: "Partenaires & Service", icon: Truck },
  { to: "/settings", label: "Paramètres", icon: SettingsIcon },
] as const;

const COLLAPSE_KEY = "drynuts.sidebar.collapsed";

export function AppShell() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, update } = useStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user, navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.settings.theme === "dark");
  }, [state.settings.theme]);

  if (!ready || !user) return null;

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      window.localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      return !c;
    });

  const toggleTheme = () =>
    update((s) => ({
      ...s,
      settings: { ...s.settings, theme: s.settings.theme === "dark" ? "light" : "dark" },
    }));

  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");

  return (
    <TooltipProvider delayDuration={120}>
      <div className="relative flex min-h-screen w-full bg-background">
        {/* ambient brand atmosphere */}
        <div className="mesh-canvas fixed inset-0 z-0" aria-hidden />
        <div className="grain-overlay fixed inset-0 z-0" aria-hidden />

        <aside
          className={cn(
            "relative z-10 hidden md:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar/85 backdrop-blur-xl text-sidebar-foreground",
            "transition-[width] duration-500 ease-[var(--ease-spring)] will-change-[width]",
            collapsed ? "w-[4.75rem]" : "w-64",
          )}
        >
          <div
            className={cn(
              "flex items-center h-16 border-b border-sidebar-border px-3",
              collapsed ? "justify-center" : "gap-3 px-4",
            )}
          >
            <div className="logo-mark h-10 w-10">
              <img src={logo} alt="Logo DryNuts" width={40} height={40} />
            </div>
            <div
              className={cn(
                "min-w-0 overflow-hidden transition-all duration-400 ease-[var(--ease-out-soft)]",
                collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
              )}
            >
              <div className="font-bold tracking-tight truncate">DryNuts</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                Fruits secs · Maroc
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2.5 space-y-1.5">
            {nav.map((item) => {
              const active =
                pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
              const Icon = item.icon;
              const link = (
                <Link
                  to={item.to}
                  className={cn(
                    "group relative flex h-11 items-center rounded-xl text-sm font-medium overflow-hidden",
                    "transition-all duration-300 ease-[var(--ease-spring)]",
                    collapsed ? "justify-center px-0" : "gap-3 px-3",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_8px_20px_-10px_var(--sidebar-primary)]"
                      : "hover:bg-sidebar-accent hover:translate-x-0.5",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[var(--accent)]" />
                  )}
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span
                    className={cn(
                      "truncate transition-all duration-300 ease-[var(--ease-out-soft)]",
                      collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
                </Tooltip>
              );
            })}
          </nav>

          <div className="p-2.5 border-t border-sidebar-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={toggleCollapsed}
                  className={cn("w-full h-10 tactile", collapsed ? "px-0" : "justify-start gap-3 px-3")}
                >
                  {collapsed ? (
                    <PanelLeftOpen className="h-[18px] w-[18px]" />
                  ) : (
                    <>
                      <PanelLeftClose className="h-[18px] w-[18px]" />
                      <span className="text-sm">Réduire</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Déployer le menu</TooltipContent>}
            </Tooltip>
          </div>
        </aside>

        <div className="relative z-10 flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 h-16 border-b bg-card/70 backdrop-blur-xl flex items-center gap-3 px-4 md:px-6">
            <GlobalSearch />
            <div className="ml-auto flex items-center gap-1">
              <NotificationBell />
              <Button variant="ghost" size="icon" onClick={toggleTheme} title="Thème" className="tactile">
                {state.settings.theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2 ml-1 tactile">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium leading-none">{user.name}</div>
                      <div className="text-[11px] text-muted-foreground">{user.email}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" /> Mon compte
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                    <SettingsIcon className="h-4 w-4 mr-2" /> Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate({ to: "/login" });
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* mobile nav */}
          <nav className="md:hidden flex gap-1 overflow-x-auto border-b bg-card/60 px-3 py-2">
            {nav.map((item) => {
              const active =
                pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-accent/20",
                  )}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="flex-1 p-4 md:p-6 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
