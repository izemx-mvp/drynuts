import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Truck, PackageOpen, Boxes, Building2 } from "lucide-react";
import { SuppliersPanel } from "@/components/panels/SuppliersPanel";

export const Route = createFileRoute("/_authenticated/partners")({
  head: () => ({
    meta: [
      { title: "Fournisseurs — DryNuts" },
      {
        name: "description",
        content: "Fournisseurs de matière première et d'emballage alimentant la chaîne DryNuts.",
      },
      { property: "og:title", content: "Fournisseurs — DryNuts" },
      {
        property: "og:description",
        content: "Gérez vos fournisseurs amont : matière première et bobines d'emballage.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  const { state } = useStore();

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
      label: "Lots matière reçus",
      value: `${state.rawMaterials.length}`,
      icon: Boxes,
      tone: "info" as const,
    },
    {
      label: "Villes couvertes",
      value: `${new Set(state.suppliers.map((s) => s.city)).size}`,
      icon: Building2,
      tone: "success" as const,
    },
  ];

  return (
    <div className="section-info">
      <PageHeader
        title="Fournisseurs"
        subtitle="L'amont de la chaîne : matière première et emballage qui alimentent la production"
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

      <SuppliersPanel />
    </div>
  );
}
