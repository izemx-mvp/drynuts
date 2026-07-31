import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Bell, Check, Factory, ShoppingCart, PackageOpen } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Target =
  | { to: "/production"; tab: "raw" | "packaging" | "workshops" | "finished" }
  | { to: "/commercial"; tab: "clients" | "orders" };

interface Notif {
  id: string;
  title: string;
  detail: string;
  icon: typeof Bell;
  tone: string;
  target: Target;
}

const READ_KEY = "drynuts.notifs.read.v1";

function loadRead(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(READ_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function NotificationBell() {
  const { state } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>(loadRead);

  const notifs = useMemo<Notif[]>(() => {
    const list: Notif[] = [];
    for (const r of state.rawMaterials) {
      if (r.quantityKg <= r.threshold) {
        list.push({
          id: `raw-${r.id}`,
          title: `Stock bas — ${r.product}`,
          detail: `${r.quantityKg} kg restants (seuil ${r.threshold} kg)`,
          icon: AlertTriangle,
          tone: "text-warning",
          target: { to: "/production", tab: "raw" },
        });
      }
    }
    for (const p of state.packaging) {
      if (p.quantityRolls <= p.threshold) {
        list.push({
          id: `pkg-${p.id}`,
          title: `Emballage bas — ${p.label}`,
          detail: `${p.quantityRolls} rouleaux (seuil ${p.threshold})`,
          icon: PackageOpen,
          tone: "text-warning",
          target: { to: "/production", tab: "packaging" },
        });
      }
    }
    for (const t of state.tasks) {
      if (t.status === "running") {
        const w = state.workshops.find((x) => x.id === t.workshopId);
        list.push({
          id: `task-${t.id}`,
          title: `Production en cours — ${t.finishedProduct}`,
          detail: `${w?.name ?? "Atelier"} · ${t.units} paquets`,
          icon: Factory,
          tone: "text-info",
          target: { to: "/production", tab: "workshops" },
        });
      }
    }
    for (const o of state.orders) {
      if (o.status === "pending") {
        const c = state.clients.find((x) => x.id === o.clientId);
        list.push({
          id: `order-${o.id}`,
          title: `Commande à traiter — ${c?.name ?? o.clientId}`,
          detail: `${o.items.length} ligne(s) · ${o.total.toLocaleString("fr-FR")} MAD`,
          icon: ShoppingCart,
          tone: "text-primary",
          target: { to: "/commercial", tab: "orders" },
        });
      }
    }
    return list;
  }, [state]);

  const unread = notifs.filter((n) => !read.includes(n.id));

  const persist = (ids: string[]) => {
    setRead(ids);
    try {
      window.localStorage.setItem(READ_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  };

  const markAllRead = () => persist(Array.from(new Set([...read, ...notifs.map((n) => n.id)])));

  const go = (n: Notif) => {
    persist(Array.from(new Set([...read, n.id])));
    setOpen(false);
    if (n.target.to === "/production") {
      navigate({ to: "/production", search: { tab: n.target.tab } });
    } else {
      navigate({ to: "/commercial", search: { tab: n.target.tab } });
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) markAllRead();
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative tactile" title="Notifications">
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow-[0_0_0_2px_var(--card)]">
              {unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-88 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-[var(--surface-2)]">
          <div className="text-sm font-semibold">Notifications</div>
          <Badge variant="outline" className="text-[10px]">
            {notifs.length} active{notifs.length > 1 ? "s" : ""}
          </Badge>
        </div>
        <ScrollArea className="max-h-80">
          {notifs.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              <Check className="mx-auto mb-2 h-6 w-6 text-success" />
              Tout est sous contrôle.
            </div>
          )}
          {notifs.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/15 border-b last:border-b-0",
                !read.includes(n.id) && "bg-primary/5",
              )}
            >
              <n.icon className={cn("mt-0.5 h-4 w-4 shrink-0", n.tone)} />
              <div className="min-w-0">
                <div className="text-sm font-medium leading-tight truncate">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{n.detail}</div>
              </div>
            </button>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
