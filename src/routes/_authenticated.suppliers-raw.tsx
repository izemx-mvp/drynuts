import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { CrudTable } from "@/components/CrudTable";
import type { Supplier } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/suppliers-raw")({
  head: () => ({
    meta: [
      { title: "Fournisseurs matière première — DryNuts" },
      { name: "description", content: "Fournisseurs de fruits secs bruts et matières premières." },
    ],
  }),
  component: SuppliersRawPage,
});

function SuppliersRawPage() {
  const { state, update } = useStore();
  const rows = state.suppliers.filter((s) => s.kind === "raw");
  return (
    <div>
      <PageHeader title="Fournisseurs · Matière première" subtitle="Fruits secs bruts (amandes, noix, dattes…)" />
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
            label: "Livraisons",
            render: (s) => state.rawMaterials.filter((r) => r.supplierId === s.id).length,
          },
        ]}
        fields={[
          { key: "name", label: "Nom", type: "text", required: true },
          { key: "category", label: "Catégorie", type: "text", required: true },
          { key: "contact", label: "Contact", type: "text", required: true },
          { key: "phone", label: "Téléphone", type: "text", required: true },
          { key: "city", label: "Ville", type: "text", required: true },
        ]}
        buildDefaults={() => ({ kind: "raw" })}
        onCreate={(row) =>
          update((s) => ({ ...s, suppliers: [{ ...row, kind: "raw" }, ...s.suppliers] }))
        }
        onUpdate={(row) =>
          update((s) => ({
            ...s,
            suppliers: s.suppliers.map((x) => (x.id === row.id ? { ...row, kind: "raw" } : x)),
          }))
        }
        onDelete={(id) => update((s) => ({ ...s, suppliers: s.suppliers.filter((x) => x.id !== id) }))}
      />
    </div>
  );
}
