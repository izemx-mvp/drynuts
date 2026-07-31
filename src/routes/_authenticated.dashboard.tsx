import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wheat,
  Package,
  Factory,
  Boxes,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — DryNuts" },
      { name: "description", content: "Vue d'ensemble stocks, ateliers et ventes DryNuts." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state } = useStore();

  const kpis = useMemo(() => {
    const rawTotal = state.rawMaterials.reduce((s, r) => s + r.quantityKg, 0);
    const pkgTotal = state.packaging.reduce((s, p) => s + p.quantityRolls, 0);
    const activeWorkshops = state.workshops.filter((w) => w.status === "running").length;
    const finishedUnits = state.finished.reduce((s, f) => s + f.units, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = state.orders.filter((o) => new Date(o.createdAt) >= todayStart).length;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthRevenue = state.orders
      .filter((o) => new Date(o.createdAt) >= monthStart && o.status !== "cancelled")
      .reduce((s, o) => s + o.total, 0);
    return { rawTotal, pkgTotal, activeWorkshops, finishedUnits, todayOrders, monthRevenue };
  }, [state]);

  const productionByWorkshop = state.workshops.map((w) => {
    const tasks = state.tasks.filter((t) => t.workshopId === w.id);
    return {
      name: w.name.replace(/Atelier /, "").split(" — ")[0],
      done: tasks.filter((t) => t.status === "done").length,
      running: tasks.filter((t) => t.status === "running").length,
      queued: tasks.filter((t) => t.status === "queued").length,
    };
  });

  const salesByType = Object.values(
    state.orders.reduce<Record<string, { name: string; total: number }>>((acc, o) => {
      const c = state.clients.find((c) => c.id === o.clientId);
      const key = c?.type ?? "Autres";
      acc[key] = acc[key] ?? { name: key, total: 0 };
      if (o.status !== "cancelled") acc[key].total += o.total;
      return acc;
    }, {}),
  );

  const stockTrend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString("fr-FR", { weekday: "short" }),
      stock: Math.round(kpis.rawTotal * (0.85 + Math.random() * 0.15)),
    };
  });

  const alerts = state.rawMaterials.filter((r) => r.quantityKg <= r.threshold);

  const recentTasks = [...state.tasks]
    .sort((a, b) => (a.status === "running" ? -1 : 1))
    .slice(0, 5);

  const kpiCards = [
    { label: "Stock matière première", value: `${kpis.rawTotal.toLocaleString("fr-FR")} kg`, icon: Wheat, color: "bg-primary/10 text-primary", to: "/production" as const, search: { tab: "raw" as const } },
    { label: "Stock emballage", value: `${kpis.pkgTotal} rouleaux`, icon: Package, color: "bg-accent/20 text-accent-foreground", to: "/production" as const, search: { tab: "packaging" as const } },
    { label: "Ateliers actifs", value: `${kpis.activeWorkshops}/${state.workshops.length}`, icon: Factory, color: "bg-info/10 text-info", to: "/production" as const, search: { tab: "workshops" as const } },
    { label: "Produits finis", value: `${kpis.finishedUnits.toLocaleString("fr-FR")} u.`, icon: Boxes, color: "bg-success/10 text-success", to: "/finished" as const },
    { label: "Commandes du jour", value: `${kpis.todayOrders}`, icon: ShoppingCart, color: "bg-warning/10 text-warning", to: "/orders" as const },
    { label: "CA du mois", value: `${(kpis.monthRevenue / 1000).toFixed(1)}k MAD`, icon: TrendingUp, color: "bg-primary/10 text-primary" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Vue temps réel de votre activité de transformation" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {kpiCards.map((k) => {
          const card = (
            <Card
              className={`p-4 h-full ${"to" in k && k.to ? "hover:border-primary/50 hover:shadow-sm transition cursor-pointer" : ""}`}
            >
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${k.color}`}>
                <k.icon className="h-4 w-4" />
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight">{k.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
            </Card>
          );
          const target = "to" in k ? k.to : undefined;
          if (!target) return <div key={k.label}>{card}</div>;
          return (
            <Link
              key={k.label}
              to={target}
              search={("search" in k ? k.search : undefined) as never}
            >
              {card}
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Production par atelier</h3>
              <p className="text-xs text-muted-foreground">Tâches par statut</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionByWorkshop}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="done" stackId="a" fill="var(--color-chart-4)" radius={[0, 0, 0, 0]} name="Terminées" />
                <Bar dataKey="running" stackId="a" fill="var(--color-chart-1)" name="En cours" />
                <Bar dataKey="queued" stackId="a" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} name="En attente" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Ventes par type de client</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByType} layout="vertical" margin={{ left: 30 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("fr-FR")} MAD`} />
                <Bar dataKey="total" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Évolution du stock (7 jours)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `${v} kg`} />
                <Line type="monotone" dataKey="stock" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" /> Alertes & activité
          </h3>
          <div className="space-y-3 text-sm">
            {alerts.length === 0 && <div className="text-xs text-muted-foreground">Aucune alerte de stock.</div>}
            {alerts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-2 pb-2 border-b last:border-0">
                <div>
                  <div className="font-medium">{a.product}</div>
                  <div className="text-xs text-muted-foreground">Stock bas · {a.quantityKg} kg</div>
                </div>
                <Badge variant="outline" className="border-warning text-warning">Faible</Badge>
              </div>
            ))}
            {recentTasks.filter((t) => t.status === "running").map((t) => {
              const w = state.workshops.find((w) => w.id === t.workshopId);
              return (
                <div key={t.id} className="pb-2 border-b last:border-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{t.finishedProduct}</span>
                    <span className="text-muted-foreground">{Math.round(t.progress)}%</span>
                  </div>
                  <Progress value={t.progress} className="h-1.5" />
                  <div className="text-[11px] text-muted-foreground mt-1">{w?.name}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
