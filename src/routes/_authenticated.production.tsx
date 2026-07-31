import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wheat, Package, Factory, Boxes } from "lucide-react";
import { RawMaterialsPanel } from "@/components/production/RawMaterialsPanel";
import { PackagingPanel } from "@/components/production/PackagingPanel";
import { WorkshopsPanel } from "@/components/production/WorkshopsPanel";
import { FinishedPanel } from "@/components/panels/FinishedPanel";

const TABS = ["raw", "packaging", "workshops", "finished"] as const;
type ProdTab = (typeof TABS)[number];
type ProdSearch = { tab?: ProdTab };

export const Route = createFileRoute("/_authenticated/production")({
  validateSearch: (search: Record<string, unknown>): ProdSearch => ({
    tab: TABS.includes(search.tab as ProdTab) ? (search.tab as ProdTab) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Production — DryNuts" },
      {
        name: "description",
        content:
          "Pipeline de fabrication DryNuts : matière première, emballage, ateliers et produits finis.",
      },
      { property: "og:title", content: "Production — DryNuts" },
      {
        property: "og:description",
        content: "Suivez la chaîne matière première → emballage → ateliers → produits finis.",
      },
    ],
  }),
  component: ProductionPage,
});

function ProductionPage() {
  const { state } = useStore();
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/production" });
  const tab: ProdTab = search.tab ?? "raw";
  const setTab = (v: string) =>
    navigate({ to: "/production", search: { tab: v as ProdTab }, replace: true });

  const rawTotal = state.rawMaterials.reduce((s, r) => s + r.quantityKg, 0);
  const pkgTotal = state.packaging.reduce((s, p) => s + p.quantityRolls, 0);
  const activeWorkshops = state.workshops.filter((w) => w.status === "running").length;
  const finishedUnits = state.finished.reduce((s, f) => s + f.units, 0);

  const summary = [
    {
      label: "Stock matière première",
      value: `${rawTotal.toLocaleString("fr-FR")} kg`,
      icon: Wheat,
      tone: "primary" as const,
    },
    {
      label: "Stock emballage",
      value: `${pkgTotal.toLocaleString("fr-FR")} rouleaux`,
      icon: Package,
      tone: "accent" as const,
    },
    {
      label: "Ateliers actifs",
      value: `${activeWorkshops}/${state.workshops.length}`,
      icon: Factory,
      tone: "info" as const,
    },
    {
      label: "Produits finis",
      value: `${finishedUnits.toLocaleString("fr-FR")} u.`,
      icon: Boxes,
      tone: "success" as const,
    },
  ];

  return (
    <div className="section-primary">
      <PageHeader
        title="Production"
        subtitle="Le pipeline complet : matière première → emballage → ateliers → produits finis"
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
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="raw">
            <Wheat className="h-4 w-4 mr-1.5" /> Matière première
          </TabsTrigger>
          <TabsTrigger value="packaging">
            <Package className="h-4 w-4 mr-1.5" /> Emballage
          </TabsTrigger>
          <TabsTrigger value="workshops">
            <Factory className="h-4 w-4 mr-1.5" /> Ateliers
          </TabsTrigger>
          <TabsTrigger value="finished">
            <Boxes className="h-4 w-4 mr-1.5" /> Produits finis
          </TabsTrigger>
        </TabsList>
        <TabsContent value="raw" className="animate-rise">
          <RawMaterialsPanel />
        </TabsContent>
        <TabsContent value="packaging" className="animate-rise">
          <PackagingPanel />
        </TabsContent>
        <TabsContent value="workshops" className="animate-rise">
          <WorkshopsPanel />
        </TabsContent>
        <TabsContent value="finished" className="animate-rise">
          <FinishedPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
