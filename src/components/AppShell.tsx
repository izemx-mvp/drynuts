import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wheat,
  Package,
  Factory,
  Boxes,
  Users,
  ShoppingCart,
  Truck,
  PackageOpen,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Search,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import logo from "@/assets/logo.png";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/raw-materials", label: "Matière première", icon: Wheat },
  { to: "/packaging", label: "Emballage", icon: Package },
  { to: "/production", label: "Ateliers / Production", icon: Factory },
  { to: "/finished", label: "Produits finis", icon: Boxes },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/orders", label: "Ventes / Commandes", icon: ShoppingCart },
  { to: "/suppliers-raw", label: "Fourn. matière", icon: Truck },
  { to: "/suppliers-packaging", label: "Fourn. emballage", icon: PackageOpen },
  { to: "/settings", label: "Paramètres", icon: SettingsIcon },
] as const;

export function AppShell() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, update } = useStore();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user, navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.settings.theme === "dark");
  }, [state.settings.theme]);

  if (!ready || !user) return null;

  const activeTasks = state.tasks.filter((t) => t.status === "running").length;
  const lowStock = state.rawMaterials.filter((r) => r.quantityKg <= r.threshold).length;
  const notif = activeTasks + lowStock;

  const toggleTheme = () =>
    update((s) => ({
      ...s,
      settings: { ...s.settings, theme: s.settings.theme === "dark" ? "light" : "dark" },
    }));

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
          <img src={logo} alt="DryNuts" className="h-9 w-9 object-contain" width={36} height={36} />
          <div>
            <div className="font-bold tracking-tight text-sidebar-foreground">DryNuts</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Fruits secs · Maroc
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {nav.map((item) => {
            const active =
              pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-lg bg-sidebar-accent p-3 text-xs text-sidebar-accent-foreground">
            <div className="font-semibold">Version démo</div>
            <div className="text-muted-foreground mt-1">Données mockées locales</div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card/70 backdrop-blur flex items-center gap-3 px-4 md:px-6">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher…"
              className="pl-9 bg-background"
            />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <div className="relative">
              <Button variant="ghost" size="icon" title="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
              {notif > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] pointer-events-none">
                  {notif}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Thème">
              {state.settings.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2 ml-1">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium leading-none">{user.name}</div>
                    <div className="text-[11px] text-muted-foreground">{user.email}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  <SettingsIcon className="h-4 w-4 mr-2" /> Paramètres
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate({ to: "/login" });
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 relative"
          style={{
            backgroundImage:
              "radial-gradient(1200px 600px at -10% -10%, color-mix(in oklch, var(--primary) 10%, transparent) 0%, transparent 60%), radial-gradient(900px 500px at 110% 10%, color-mix(in oklch, var(--accent) 18%, transparent) 0%, transparent 55%), radial-gradient(700px 500px at 50% 120%, color-mix(in oklch, var(--primary) 8%, transparent) 0%, transparent 60%)",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
