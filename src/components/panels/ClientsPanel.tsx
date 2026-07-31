import { useStore } from "@/lib/store";
import { CrudTable } from "@/components/CrudTable";
import { Badge } from "@/components/ui/badge";
import type { Client } from "@/lib/types";


export function ClientsPanel() {
  const { state, update } = useStore();

  return (
    <div>
      <CrudTable<Client>
        data={state.clients}
        columns={[
          { key: "name", label: "Nom" },
          {
            key: "type",
            label: "Type",
            render: (c) => <Badge variant="secondary">{c.type}</Badge>,
          },
          { key: "contact", label: "Contact" },
          { key: "phone", label: "Téléphone" },
          { key: "city", label: "Ville" },
          {
            key: "id",
            label: "Commandes",
            render: (c) => state.orders.filter((o) => o.clientId === c.id).length,
          },
          {
            key: "id" as keyof Client & string,
            label: "Stock réservé",
            render: (c) => {
              const total = state.finished
                .filter((f) => f.packType === "custom" && f.clientId === c.id)
                .reduce((s, f) => s + f.units, 0);
              return total > 0 ? (
                <Badge className="bg-info text-info-foreground">{total.toLocaleString("fr-FR")} u.</Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              );
            },
          },
        ]}
        fields={[
          { key: "name", label: "Nom", type: "text", required: true },
          {
            key: "type",
            label: "Type de client",
            type: "select",
            required: true,
            options: state.settings.clientTypes.map((t) => ({ value: t, label: t })),
          },
          { key: "contact", label: "Personne à contacter", type: "text", required: true },
          { key: "phone", label: "Téléphone", type: "text", required: true },
          { key: "city", label: "Ville", type: "text", required: true },
        ]}
        onCreate={(row) => update((s) => ({ ...s, clients: [row, ...s.clients] }))}
        onUpdate={(row) =>
          update((s) => ({ ...s, clients: s.clients.map((c) => (c.id === row.id ? row : c)) }))
        }
        onDelete={(id) => update((s) => ({ ...s, clients: s.clients.filter((c) => c.id !== id) }))}
      />
    </div>
  );
}
