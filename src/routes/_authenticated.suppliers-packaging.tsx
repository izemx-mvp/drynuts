import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { CrudTable } from "@/components/CrudTable";
import type { Supplier } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/suppliers-packaging")({
  head: () => ({
    meta: [
      { title: "Fournisseurs emballage — DryNuts" },
      { name: "description", content: "Fournisseurs d'emballages standard et personnalisés." },
    ],
  }),
  component: SuppliersPackagingPage,
});

function SuppliersPackagingPage() {
  const { state, update } = useStore();
  const rows = state.suppliers.filter((s) => s.kind === "packaging");
  return (
    <div>
      <PageHeader title="Fournisseurs · Emballage" subtitle="Sachets, bobines, emballages personnalisés" />
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
            render: (s) => state.packaging.filter((p) => p.supplierId === s.id).length,
          },
        ]}
        fields={[
          { key: "name", label: "Nom", type: "text", required: true },
          { key: "category", label: "Catégorie", type: "text", required: true },
          { key: "contact", label: "Contact", type: "text", required: true },
          { key: "phone", label: "Téléphone", type: "text", required: true },
          { key: "city", label: "Ville", type: "text", required: true },
        ]}
        buildDefaults={() => ({ kind: "packaging" })}
        onCreate={(row) =>
          update((s) => ({ ...s, suppliers: [{ ...row, kind: "packaging" }, ...s.suppliers] }))
        }
        onUpdate={(row) =>
          update((s) => ({
            ...s,
            suppliers: s.suppliers.map((x) => (x.id === row.id ? { ...row, kind: "packaging" } : x)),
          }))
        }
        onDelete={(id) => update((s) => ({ ...s, suppliers: s.suppliers.filter((x) => x.id !== id) }))}
      />
    </div>
  );
}
