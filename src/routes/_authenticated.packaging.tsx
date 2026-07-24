import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { CrudTable } from "@/components/CrudTable";
import { Badge } from "@/components/ui/badge";
import type { Packaging } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/packaging")({
  head: () => ({
    meta: [
      { title: "Stock emballage — DryNuts" },
      { name: "description", content: "Bobines et rouleaux d'emballage standard et personnalisé." },
    ],
  }),
  component: PackagingPage,
});

function PackagingPage() {
  const { state, update } = useStore();

  return (
    <div>
      <PageHeader title="Stock emballage" subtitle="Bobines standard et personnalisées par client" />
      <CrudTable<Packaging>
        data={state.packaging}
        buildDefaults={() => ({
          receivedAt: new Date().toISOString().slice(0, 10),
          type: "standard",
          threshold: 5,
        })}
        columns={[
          { key: "label", label: "Emballage" },
          { key: "size", label: "Taille" },
          {
            key: "type",
            label: "Type",
            render: (p) =>
              p.type === "custom" ? (
                <Badge className="bg-info text-info-foreground">Personnalisé</Badge>
              ) : (
                <Badge variant="secondary">Standard</Badge>
              ),
          },
          {
            key: "clientId",
            label: "Client",
            render: (p) =>
              p.clientId ? state.clients.find((c) => c.id === p.clientId)?.name ?? "—" : "—",
          },
          { key: "quantityRolls", label: "Rouleaux" },
          {
            key: "supplierId",
            label: "Fournisseur",
            render: (p) => state.suppliers.find((s) => s.id === p.supplierId)?.name ?? "—",
          },
          {
            key: "receivedAt",
            label: "Reçu le",
            render: (p) => new Date(p.receivedAt).toLocaleDateString("fr-FR"),
          },
          {
            key: "id",
            label: "Statut",
            render: (p) => {
              const low = p.quantityRolls <= p.threshold;
              return (
                <Badge
                  variant="outline"
                  className={low ? "border-warning text-warning" : "border-success text-success"}
                >
                  {low ? "Stock bas" : "OK"}
                </Badge>
              );
            },
          },
        ]}
        fields={[
          { key: "label", label: "Libellé", type: "text", required: true },
          {
            key: "size",
            label: "Taille",
            type: "select",
            required: true,
            options: state.settings.packSizes.map((s) => ({ value: s, label: s })),
          },
          {
            key: "type",
            label: "Type d'emballage",
            type: "select",
            required: true,
            options: [
              { value: "standard", label: "Standard" },
              { value: "custom", label: "Personnalisé" },
            ],
          },
          {
            key: "clientId",
            label: "Client (si personnalisé)",
            type: "select",
            options: state.clients.map((c) => ({ value: c.id, label: c.name })),
            hidden: (r) => r.type !== "custom",
          },
          { key: "quantityRolls", label: "Quantité (rouleaux)", type: "number", required: true },
          {
            key: "supplierId",
            label: "Fournisseur",
            type: "select",
            required: true,
            options: state.suppliers.map((s) => ({ value: s.id, label: s.name })),
          },
          { key: "receivedAt", label: "Date de réception", type: "date", required: true },
          { key: "threshold", label: "Seuil d'alerte", type: "number", required: true },
        ]}
        onCreate={(row) => update((s) => ({ ...s, packaging: [row, ...s.packaging] }))}
        onUpdate={(row) =>
          update((s) => ({
            ...s,
            packaging: s.packaging.map((p) => (p.id === row.id ? row : p)),
          }))
        }
        onDelete={(id) => update((s) => ({ ...s, packaging: s.packaging.filter((p) => p.id !== id) }))}
      />
    </div>
  );
}
