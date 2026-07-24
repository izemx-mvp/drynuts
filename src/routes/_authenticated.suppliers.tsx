import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { CrudTable } from "@/components/CrudTable";
import type { Supplier } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/suppliers")({
  head: () => ({
    meta: [
      { title: "Fournisseurs — DryNuts" },
      { name: "description", content: "Gestion des fournisseurs de matière première et emballage." },
    ],
  }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const { state, update } = useStore();
  return (
    <div>
      <PageHeader title="Fournisseurs" subtitle="Matière première et emballage" />
      <CrudTable<Supplier>
        data={state.suppliers}
        columns={[
          { key: "name", label: "Nom" },
          { key: "category", label: "Catégorie" },
          { key: "contact", label: "Contact" },
          { key: "phone", label: "Téléphone" },
          { key: "city", label: "Ville" },
          {
            key: "id",
            label: "Livraisons",
            render: (s) =>
              state.rawMaterials.filter((r) => r.supplierId === s.id).length +
              state.packaging.filter((p) => p.supplierId === s.id).length,
          },
        ]}
        fields={[
          { key: "name", label: "Nom", type: "text", required: true },
          { key: "category", label: "Catégorie", type: "text", required: true },
          { key: "contact", label: "Contact", type: "text", required: true },
          { key: "phone", label: "Téléphone", type: "text", required: true },
          { key: "city", label: "Ville", type: "text", required: true },
        ]}
        onCreate={(row) => update((s) => ({ ...s, suppliers: [row, ...s.suppliers] }))}
        onUpdate={(row) =>
          update((s) => ({ ...s, suppliers: s.suppliers.map((x) => (x.id === row.id ? row : x)) }))
        }
        onDelete={(id) =>
          update((s) => ({ ...s, suppliers: s.suppliers.filter((x) => x.id !== id) }))
        }
      />
    </div>
  );
}
