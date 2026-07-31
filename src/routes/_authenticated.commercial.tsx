import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ShoppingCart, Wallet, Clock } from "lucide-react";
import { ClientsPanel } from "@/components/panels/ClientsPanel";
import { OrdersPanel } from "@/components/panels/OrdersPanel";

const TABS = ["orders", "clients"] as const;
type Tab = (typeof TABS)[number];


export const Route = createFileRoute("/_authenticated/commercial")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => ({
    tab: TABS.includes(search.tab as Tab) ? (search.tab as Tab) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Commercial — DryNuts" },
      {
        name: "description",
        content: "Clients B2B et commandes DryNuts : du bon de commande à la livraison.",
      },
      { property: "og:title", content: "Commercial — DryNuts" },
      {
        property: "og:description",
        content: "Gérez vos grossistes, détaillants et le pipeline de commandes.",
      },
    ],
  }),
  component: CommercialPage,
});

function CommercialPage() {
  const { state } = useStore();
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/commercial" });
  const tab: Tab = search.tab ?? "orders";
  const setTab = (v: string) =>
    navigate({ to: "/commercial", search: { tab: v as Tab }, replace: true });

  const revenue = state.orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);
  const pending = state.orders.filter(
    (o) => o.status === "pending" || o.status === "production",
  ).length;

  const summary = [
    { label: "Clients actifs", value: `${state.clients.length}`, icon: Users, tone: "primary" as const },
    { label: "Commandes", value: `${state.orders.length}`, icon: ShoppingCart, tone: "accent" as const },
    { label: "En cours", value: `${pending}`, icon: Clock, tone: "info" as const },
    {
      label: "Chiffre d'affaires",
      value: `${revenue.toLocaleString("fr-FR")} MAD`,
      icon: Wallet,
      tone: "success" as const,
    },
  ];

  return (
    <div className="section-accent">
      <PageHeader
        title="Commercial"
        subtitle="Clients, commandes et suivi du pipeline de vente jusqu'à la livraison"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {summary.map((s, i) => (
          <Card
            key={s.label}
            className="glow-card p-4 flex items-center gap-3 animate-rise"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`tone-chip tone-${s.tone}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold tracking-tight truncate">{s.value}</div>
              <div className="text-xs text-muted-foreground truncate">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="orders">
            <ShoppingCart className="h-4 w-4 mr-1.5" /> Commandes → Livraison
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Users className="h-4 w-4 mr-1.5" /> Clients
          </TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="animate-rise">
          <OrdersPanel />
        </TabsContent>
        <TabsContent value="clients" className="animate-rise">
          <ClientsPanel />
        </TabsContent>
      </Tabs>

    </div>
  );
}
