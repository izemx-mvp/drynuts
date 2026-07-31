import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Headphones, PackageOpen, HelpCircle } from "lucide-react";
import { SuppliersPanel } from "@/components/panels/SuppliersPanel";
import { CustomerServicePanel } from "@/components/panels/CustomerServicePanel";

const TABS = ["suppliers", "service"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/_authenticated/partners")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => ({
    tab: TABS.includes(search.tab as Tab) ? (search.tab as Tab) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Partenaires & Service — DryNuts" },
      {
        name: "description",
        content:
          "Fournisseurs matière première et emballage, horaires, services et FAQ du service client.",
      },
      { property: "og:title", content: "Partenaires & Service — DryNuts" },
      {
        property: "og:description",
        content: "Vos fournisseurs et votre relation client au même endroit.",
      },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  const { state } = useStore();
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/partners" });
  const tab: Tab = search.tab ?? "suppliers";
  const setTab = (v: string) =>
    navigate({ to: "/partners", search: { tab: v as Tab }, replace: true });

  const summary = [
    {
      label: "Fournisseurs matière",
      value: `${state.suppliers.filter((s) => s.kind === "raw").length}`,
      icon: Truck,
      tone: "primary" as const,
    },
    {
      label: "Fournisseurs emballage",
      value: `${state.suppliers.filter((s) => s.kind === "packaging").length}`,
      icon: PackageOpen,
      tone: "accent" as const,
    },
    {
      label: "Services proposés",
      value: `${state.customerService.services.length}`,
      icon: Headphones,
      tone: "info" as const,
    },
    {
      label: "Questions FAQ",
      value: `${state.customerService.faq.length}`,
      icon: HelpCircle,
      tone: "success" as const,
    },
  ];

  return (
    <div className="section-info">
      <PageHeader
        title="Partenaires & Service"
        subtitle="Fournisseurs amont et relation client aval — les deux extrémités de la chaîne"
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
          <TabsTrigger value="suppliers">
            <Truck className="h-4 w-4 mr-1.5" /> Fournisseurs
          </TabsTrigger>
          <TabsTrigger value="service">
            <Headphones className="h-4 w-4 mr-1.5" /> Service Client
          </TabsTrigger>
        </TabsList>
        <TabsContent value="suppliers" className="animate-rise">
          <SuppliersPanel />
        </TabsContent>
        <TabsContent value="service" className="animate-rise">
          <CustomerServicePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
