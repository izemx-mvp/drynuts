import { useStore } from "@/lib/store";
import { CrudTable } from "@/components/CrudTable";
import { Badge } from "@/components/ui/badge";
import type { RawMaterial } from "@/lib/types";

export function RawMaterialsPanel() {
  const { state, update } = useStore();

  return (
    <CrudTable<RawMaterial>
      data={state.rawMaterials}
      buildDefaults={() => ({ receivedAt: new Date().toISOString().slice(0, 10), threshold: 100 })}
      columns={[
        { key: "product", label: "Produit" },
        {
          key: "quantityKg",
          label: "Quantité (kg)",
          render: (r) => r.quantityKg.toLocaleString("fr-FR"),
        },
        {
          key: "supplierId",
          label: "Fournisseur",
          render: (r) => state.suppliers.find((s) => s.id === r.supplierId)?.name ?? "—",
        },
        {
          key: "receivedAt",
          label: "Reçu le",
          render: (r) => new Date(r.receivedAt).toLocaleDateString("fr-FR"),
        },
        { key: "threshold", label: "Seuil" },
        {
          key: "id",
          label: "Statut",
          render: (r) => {
            const low = r.quantityKg <= r.threshold;
            const out = r.quantityKg === 0;
            return (
              <Badge
                variant="outline"
                className={
                  out
                    ? "border-destructive text-destructive"
                    : low
                      ? "border-warning text-warning"
                      : "border-success text-success"
                }
              >
                {out ? "Rupture" : low ? "Stock bas" : "OK"}
              </Badge>
            );
          },
        },
      ]}
      fields={[
        {
          key: "product",
          label: "Type de fruit sec",
          type: "select",
          required: true,
          options: state.settings.products.map((p) => ({ value: p, label: p })),
        },
        { key: "quantityKg", label: "Quantité (kg)", type: "number", required: true, step: "0.1" },
        {
          key: "supplierId",
          label: "Fournisseur",
          type: "select",
          required: true,
          options: state.suppliers.map((s) => ({ value: s.id, label: s.name })),
        },
        { key: "receivedAt", label: "Date de réception", type: "date", required: true },
        { key: "threshold", label: "Seuil d'alerte (kg)", type: "number", required: true },
      ]}
      onCreate={(row) => update((s) => ({ ...s, rawMaterials: [row, ...s.rawMaterials] }))}
      onUpdate={(row) =>
        update((s) => ({
          ...s,
          rawMaterials: s.rawMaterials.map((r) => (r.id === row.id ? row : r)),
        }))
      }
      onDelete={(id) =>
        update((s) => ({ ...s, rawMaterials: s.rawMaterials.filter((r) => r.id !== id) }))
      }
    />
  );
}
