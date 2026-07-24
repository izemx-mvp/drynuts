import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { CrudTable } from "@/components/CrudTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Truck, PackageOpen } from "lucide-react";
import type { Supplier } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/suppliers")({
  head: () => ({
    meta: [
      { title: "Fournisseurs — DryNuts" },
      { name: "description", content: "Fournisseurs de matière première et d'emballage." },
      { property: "og:title", content: "Fournisseurs — DryNuts" },
      { property: "og:description", content: "Gérez vos fournisseurs par type." },
    ],
  }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const { state, update } = useStore();
  const [tab, setTab] = useState<"raw" | "packaging">("raw");

  const renderTable = (kind: "raw" | "packaging") => {
    const rows = state.suppliers.filter((s) => s.kind === kind);
    return (
      <CrudTable<Supplier>
        data={rows}
        columns={[
          { key: "name", label: "Nom" },
          { key: "category", label: "Catégorie" },
          { key: "contact", label: "Contact" },
          { key: "phone", label: "Téléphone" },
          { key: "city", label: "Ville" },
          {
            key: "id",
            label: kind === "raw" ? "Livraisons" : "Rouleaux",
            render: (s) =>
              kind === "raw"
                ? state.rawMaterials.filter((r) => r.supplierId === s.id).length
                : state.packaging.filter((p) => p.supplierId === s.id).length,
          },
        ]}
        fields={[
          { key: "name", label: "Nom", type: "text", required: true },
          { key: "category", label: "Catégorie", type: "text", required: true },
          { key: "contact", label: "Contact", type: "text", required: true },
          { key: "phone", label: "Téléphone", type: "text", required: true },
          { key: "city", label: "Ville", type: "text", required: true },
        ]}
        buildDefaults={() => ({ kind })}
        onCreate={(row) =>
          update((s) => ({ ...s, suppliers: [{ ...row, kind }, ...s.suppliers] }))
        }
        onUpdate={(row) =>
          update((s) => ({
            ...s,
            suppliers: s.suppliers.map((x) => (x.id === row.id ? { ...row, kind } : x)),
          }))
        }
        onDelete={(id) =>
          update((s) => ({ ...s, suppliers: s.suppliers.filter((x) => x.id !== id) }))
        }
      />
    );
  };

  return (
    <div>
      <PageHeader
        title="Fournisseurs"
        subtitle="Répertoire unifié — filtré par type"
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as "raw" | "packaging")}>
        <TabsList className="mb-4">
          <TabsTrigger value="raw" className="gap-2">
            <Truck className="h-4 w-4" /> Matière première
            <span className="ml-1 text-xs text-muted-foreground">
              ({state.suppliers.filter((s) => s.kind === "raw").length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="packaging" className="gap-2">
            <PackageOpen className="h-4 w-4" /> Emballage
            <span className="ml-1 text-xs text-muted-foreground">
              ({state.suppliers.filter((s) => s.kind === "packaging").length})
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="raw">{renderTable("raw")}</TabsContent>
        <TabsContent value="packaging">{renderTable("packaging")}</TabsContent>
      </Tabs>
    </div>
  );
}
