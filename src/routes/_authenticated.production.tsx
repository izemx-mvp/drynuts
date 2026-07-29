import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wheat, Package, Factory } from "lucide-react";
import { RawMaterialsPanel } from "@/components/production/RawMaterialsPanel";
import { PackagingPanel } from "@/components/production/PackagingPanel";
import { WorkshopsPanel } from "@/components/production/WorkshopsPanel";

type ProdSearch = { tab?: "raw" | "packaging" | "workshops" };

export const Route = createFileRoute("/_authenticated/production")({
  validateSearch: (search: Record<string, unknown>): ProdSearch => ({
    tab:
      search.tab === "raw" || search.tab === "packaging" || search.tab === "workshops"
        ? search.tab
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Production — DryNuts" },
      {
        name: "description",
        content:
          "Interface unifiée : matière première, emballage et ateliers de production DryNuts.",
      },
    ],
  }),
  component: ProductionPage,
});

function ProductionPage() {
  const { state } = useStore();
  const search = useSearch({ from: "/_authenticated/production" });
  const [tab, setTab] = useState<string>(search.tab ?? "raw");

  useEffect(() => {
    if (search.tab) setTab(search.tab);
  }, [search.tab]);

  const rawTotal = state.rawMaterials.reduce((s, r) => s + r.quantityKg, 0);
  const pkgTotal = state.packaging.reduce((s, p) => s + p.quantityRolls, 0);
  const activeWorkshops = state.workshops.filter((w) => w.status === "running").length;

  const summary = [
    {
      label: "Stock matière première",
      value: `${rawTotal.toLocaleString("fr-FR")} kg`,
      icon: Wheat,
      cn: "bg-primary/10 text-primary",
    },
    {
      label: "Stock emballage",
      value: `${pkgTotal.toLocaleString("fr-FR")} rouleaux`,
      icon: Package,
      cn: "bg-accent/20 text-accent-foreground",
    },
    {
      label: "Ateliers actifs",
      value: `${activeWorkshops}/${state.workshops.length}`,
      icon: Factory,
      cn: "bg-info/10 text-info",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Production"
        subtitle="Tout le cycle de fabrication : matière première → emballage → ateliers → produits finis"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {summary.map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.cn}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="raw">
            <Wheat className="h-4 w-4 mr-1.5" /> Matière première
          </TabsTrigger>
          <TabsTrigger value="packaging">
            <Package className="h-4 w-4 mr-1.5" /> Emballage
          </TabsTrigger>
          <TabsTrigger value="workshops">
            <Factory className="h-4 w-4 mr-1.5" /> Ateliers & Production
          </TabsTrigger>
        </TabsList>
        <TabsContent value="raw">
          <RawMaterialsPanel />
        </TabsContent>
        <TabsContent value="packaging">
          <PackagingPanel />
        </TabsContent>
        <TabsContent value="workshops">
          <WorkshopsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
