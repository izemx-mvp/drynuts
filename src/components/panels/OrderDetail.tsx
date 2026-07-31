import { useStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingCart,
  Factory,
  PackageCheck,
  Truck,
  Lock,
  Wheat,
  Ban,
  FileText,
  Zap,
} from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { availableUnits, rawOf } from "@/lib/pipeline";

export const ORDER_FLOW: {
  key: OrderStatus;
  label: string;
  icon: typeof ShoppingCart;
  auto: string;
}[] = [
  {
    key: "pending",
    label: "Commande reçue",
    icon: ShoppingCart,
    auto: "Le stock produits finis est comparé à chaque ligne de la commande.",
  },
  {
    key: "production",
    label: "En production",
    icon: Factory,
    auto:
      "Une tâche est créée automatiquement pour la quantité manquante, sur l'atelier le moins chargé.",
  },
  {
    key: "validated",
    label: "Prête à livrer",
    icon: PackageCheck,
    auto:
      "Dès que la production couvre toutes les lignes, la commande passe seule à « Prête ».",
  },
  {
    key: "delivered",
    label: "Livrée",
    icon: Truck,
    auto: "La livraison déduit le stock produits finis en FIFO (date de production).",
  },
];

const flowIndex = (s: OrderStatus) => ORDER_FLOW.findIndex((f) => f.key === s);

export function OrderDetail({
  order,
  onClose,
  onDeliver,
  onCancel,
  onInvoice,
}: {
  order: Order | null;
  onClose: () => void;
  onDeliver: (id: string) => void;
  onCancel: (id: string) => void;
  onInvoice: (o: Order) => void;
}) {
  const { state } = useStore();
  if (!order) return null;

  const client = state.clients.find((c) => c.id === order.clientId);
  const tasks = state.tasks.filter((t) => t.orderId === order.id);
  const idx = flowIndex(order.status);

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Commande {order.id.slice(-6).toUpperCase()}
            <Badge variant="secondary">{client?.type}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* client */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Field label="Client" value={client?.name ?? "—"} />
            <Field label="Contact" value={client?.contact ?? "—"} />
            <Field label="Ville" value={client?.city ?? "—"} />
            <Field
              label="Date"
              value={new Date(order.createdAt).toLocaleDateString("fr-FR")}
            />
          </div>

          {/* pipeline timeline */}
          <div className="rounded-xl border p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-accent" /> Parcours automatisé
            </div>
            <ol className="space-y-3">
              {ORDER_FLOW.map((step, i) => {
                const done = idx >= i && order.status !== "cancelled";
                const current = idx === i;
                return (
                  <li key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all duration-300 ${
                          done
                            ? "bg-primary text-primary-foreground border-primary"
                            : "text-muted-foreground border-border"
                        } ${current ? "ring-2 ring-accent/50" : ""}`}
                      >
                        <step.icon className="h-4 w-4" />
                      </div>
                      {i < ORDER_FLOW.length - 1 && (
                        <div
                          className={`w-px flex-1 min-h-6 ${done ? "bg-primary/60" : "bg-border"}`}
                        />
                      )}
                    </div>
                    <div className="pb-2">
                      <div className="text-sm font-medium">{step.label}</div>
                      <div className="text-xs text-muted-foreground">{step.auto}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* lines */}
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Paquets</TableHead>
                  <TableHead>Couverture stock</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((it, i) => {
                  const have = availableUnits(
                    state,
                    it.product,
                    it.packSize,
                    it.packType,
                    order.clientId,
                  );
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {it.product} · {it.packSize}
                        {it.packType === "custom" && (
                          <Badge className="ml-2 bg-info text-info-foreground text-[10px]">
                            <Lock className="h-2.5 w-2.5 mr-0.5" /> Réservé
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {it.units} × {it.unitPrice} MAD
                      </TableCell>
                      <TableCell
                        className={have >= it.units ? "text-success" : "text-warning"}
                      >
                        {have} / {it.units}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Wheat className="h-3 w-3" /> {rawOf(state, it.product)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {(it.units * it.unitPrice).toLocaleString("fr-FR")} MAD
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* linked production */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Tâches de production liées
            </div>
            {tasks.length === 0 ? (
              <div className="text-sm text-muted-foreground rounded-lg border border-dashed p-3">
                Aucune tâche — la commande était couverte par le stock existant.
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => {
                  const ws = state.workshops.find((w) => w.id === t.workshopId);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="font-medium">
                          {t.finishedProduct} {t.packSize} · {t.units} paquets
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ws?.name ?? "Atelier"} · {t.quantityKg} kg de {t.product}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          t.status === "done"
                            ? "border-success text-success"
                            : t.status === "running"
                              ? "border-warning text-warning"
                              : "border-muted-foreground text-muted-foreground"
                        }
                      >
                        {t.status === "done"
                          ? "Terminée"
                          : t.status === "running"
                            ? "En cours"
                            : "En file"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <div className="font-semibold text-base">
              Total {order.total.toLocaleString("fr-FR")} MAD
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onInvoice(order)}>
                <FileText className="h-4 w-4 mr-1" /> Facture
              </Button>
              {order.status !== "delivered" && order.status !== "cancelled" && (
                <Button variant="outline" size="sm" onClick={() => onCancel(order.id)}>
                  <Ban className="h-4 w-4 mr-1 text-destructive" /> Annuler
                </Button>
              )}
              {order.status === "validated" && (
                <Button size="sm" onClick={() => onDeliver(order.id)}>
                  <Truck className="h-4 w-4 mr-1" /> Livrer
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-medium truncate">{value}</div>
    </div>
  );
}
