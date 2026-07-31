import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, genId } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Check,
  Ban,
  Trash2,
  FileText,
  Lock,
  X,
  ShoppingCart,
  Factory,
  PackageCheck,
  Truck,
  Wheat,
} from "lucide-react";
import { toast } from "sonner";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";
import {
  availableUnits,
  deliverOrder,
  packTypeForClient,
  placeOrder,
  rawKgFor,
  rawOf,
  rollsFor,
} from "@/lib/pipeline";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "Ventes / Commandes — DryNuts" },
      {
        name: "description",
        content:
          "Pipeline commercial DryNuts : de la commande client à la production puis à la livraison.",
      },
      { property: "og:title", content: "Ventes / Commandes — DryNuts" },
      {
        property: "og:description",
        content: "Pipeline automatisé commande → production → prête → livrée.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrdersPage,
});

const statusMeta: Record<OrderStatus, { label: string; cn: string }> = {
  pending: { label: "Reçue", cn: "border-muted-foreground text-muted-foreground" },
  production: { label: "En production", cn: "border-warning text-warning" },
  validated: { label: "Prête", cn: "border-info text-info" },
  delivered: { label: "Livrée", cn: "border-success text-success" },
  cancelled: { label: "Annulée", cn: "border-destructive text-destructive" },
};

const pipelineSteps: { key: OrderStatus; label: string; icon: typeof ShoppingCart }[] = [
  { key: "pending", label: "Commande reçue", icon: ShoppingCart },
  { key: "production", label: "En production", icon: Factory },
  { key: "validated", label: "Prête à livrer", icon: PackageCheck },
  { key: "delivered", label: "Livrée", icon: Truck },
];

function OrdersPage() {
  const { state, update } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [clientType, setClientType] = useState<string>("all");
  const [openNew, setOpenNew] = useState(false);
  const [invoice, setInvoice] = useState<Order | null>(null);

  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [pickProduct, setPickProduct] = useState<string>("");
  const [pickSize, setPickSize] = useState<string>("250g");
  const [pickUnits, setPickUnits] = useState(100);
  const [pickPrice, setPickPrice] = useState(20);

  const filtered = useMemo(() => {
    return state.orders.filter((o) => {
      const client = state.clients.find((c) => c.id === o.clientId);
      if (status !== "all" && o.status !== status) return false;
      if (clientType !== "all" && client?.type !== clientType) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        if (
          !client?.name.toLowerCase().includes(s) &&
          !o.id.toLowerCase().includes(s) &&
          !o.items.some((it) => it.product.toLowerCase().includes(s))
        )
          return false;
      }
      return true;
    });
  }, [state.orders, state.clients, q, status, clientType]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of state.orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [state.orders]);

  /** what the current selection means in stock / production terms */
  const preview = useMemo(() => {
    if (!clientId || !pickProduct) return null;
    const packType = packTypeForClient(state, clientId, pickSize);
    const have = availableUnits(state, pickProduct, pickSize, packType, clientId);
    const missing = Math.max(0, pickUnits - have);
    return {
      packType,
      have,
      missing,
      rawProduct: rawOf(state, pickProduct),
      rawKg: rawKgFor(missing, pickSize),
      rolls: missing > 0 ? rollsFor(missing) : 0,
    };
  }, [state, clientId, pickProduct, pickSize, pickUnits]);

  const addItem = () => {
    if (!pickProduct || !preview) {
      toast.error("Choisissez un produit final.");
      return;
    }
    if (pickUnits <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        productId: `${pickProduct}-${pickSize}`,
        product: pickProduct,
        packSize: pickSize,
        packType: preview.packType,
        units: pickUnits,
        unitPrice: pickPrice,
      },
    ]);
    setPickProduct("");
  };

  const total = items.reduce((s, it) => s + it.units * it.unitPrice, 0);

  const submit = () => {
    if (!clientId) {
      toast.error("Sélectionnez un client.");
      return;
    }
    if (items.length === 0) {
      toast.error("Ajoutez au moins un produit.");
      return;
    }
    const order: Order = {
      id: genId("ord"),
      clientId,
      items,
      total,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    update((s) => placeOrder(s, order));
    toast.success("Commande enregistrée — production lancée automatiquement si nécessaire");
    setClientId("");
    setItems([]);
    setOpenNew(false);
  };

  const deliver = (id: string) => {
    update((s) => deliverOrder(s, id));
    toast.success("Commande livrée — stock produits finis déduit");
  };
  const cancel = (id: string) => {
    update((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o)),
    }));
    toast.success("Commande annulée");
  };
  const del = (id: string) => {
    if (!confirm("Supprimer cette commande ?")) return;
    update((s) => ({ ...s, orders: s.orders.filter((o) => o.id !== id) }));
    toast.success("Supprimée");
  };

  return (
    <div>
      <PageHeader
        title="Ventes / Commandes"
        subtitle="Pipeline automatisé : commande → production → prête → livraison"
        actions={
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" /> Nouvelle commande
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouvelle commande</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-1.5">
                  <Label>Client</Label>
                  <Select
                    value={clientId}
                    onValueChange={(v) => {
                      setClientId(v);
                      setItems([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client…" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} — {c.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {clientId && (
                  <div className="rounded-lg border p-3 bg-muted/30 space-y-3">
                    <div className="grid grid-cols-[1fr_90px_90px_90px_auto] gap-2 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Produit final</Label>
                        <Select value={pickProduct} onValueChange={setPickProduct}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir…" />
                          </SelectTrigger>
                          <SelectContent>
                            {state.settings.finishedProducts.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Taille</Label>
                        <Select value={pickSize} onValueChange={setPickSize}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {state.settings.packSizes.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Paquets</Label>
                        <Input
                          type="number"
                          value={pickUnits}
                          onChange={(e) => setPickUnits(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">PU (MAD)</Label>
                        <Input
                          type="number"
                          value={pickPrice}
                          onChange={(e) => setPickPrice(Number(e.target.value))}
                        />
                      </div>
                      <Button type="button" onClick={addItem}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {preview && (
                      <div className="rounded-md bg-card border p-2.5 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stock disponible</span>
                          <span className="font-medium">
                            {preview.have} paquets ·{" "}
                            {preview.packType === "custom" ? "réservé client" : "standard"}
                          </span>
                        </div>
                        {preview.missing > 0 ? (
                          <>
                            <div className="flex justify-between text-warning">
                              <span>À produire</span>
                              <span className="font-medium">{preview.missing} paquets</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Wheat className="h-3 w-3" /> Matière première nécessaire
                              </span>
                              <span>
                                {preview.rawKg.toLocaleString("fr-FR")} kg de {preview.rawProduct} ·{" "}
                                {preview.rolls} rouleau(x)
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-success">Entièrement couvert par le stock</div>
                        )}
                      </div>
                    )}

                    {items.length > 0 && (
                      <div className="space-y-1">
                        {items.map((it, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-sm bg-card border rounded px-2 py-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{it.product}</span>
                              <span className="text-muted-foreground">
                                {it.packSize} · {it.units}u × {it.unitPrice} MAD
                              </span>
                              {it.packType === "custom" && (
                                <Badge className="bg-info text-info-foreground text-[10px]">
                                  <Lock className="h-2.5 w-2.5 mr-0.5" /> Réservé
                                </Badge>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t font-semibold">
                          <span>Total</span>
                          <span>{total.toLocaleString("fr-FR")} MAD</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenNew(false)}>
                  Annuler
                </Button>
                <Button onClick={submit}>Créer la commande</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Pipeline overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {pipelineSteps.map((step, i) => (
          <Card key={step.key} className="p-4 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <step.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xl font-bold leading-none">{counts[step.key] ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {i + 1}. {step.label}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">Reçue</SelectItem>
            <SelectItem value="production">En production</SelectItem>
            <SelectItem value="validated">Prête</SelectItem>
            <SelectItem value="delivered">Livrée</SelectItem>
            <SelectItem value="cancelled">Annulée</SelectItem>
          </SelectContent>
        </Select>
        <Select value={clientType} onValueChange={setClientType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types clients</SelectItem>
            {state.settings.clientTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Étape</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Aucune commande
                </TableCell>
              </TableRow>
            )}
            {filtered.map((o) => {
              const client = state.clients.find((c) => c.id === o.clientId);
              const st = statusMeta[o.status];
              const openTasks = state.tasks.filter(
                (t) => t.orderId === o.id && t.status !== "done",
              ).length;
              return (
                <TableRow key={o.id} className="hover:bg-muted/40">
                  <TableCell className="font-mono text-xs">{o.id.slice(-6)}</TableCell>
                  <TableCell className="font-medium">{client?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{client?.type}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {o.items.map((it) => `${it.product} ${it.packSize}×${it.units}`).join(", ")}
                  </TableCell>
                  <TableCell className="font-semibold">{o.total.toLocaleString("fr-FR")} MAD</TableCell>
                  <TableCell className="text-xs">
                    {new Date(o.createdAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant="outline" className={st.cn}>
                        {st.label}
                      </Badge>
                      {openTasks > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {openTasks} tâche(s) atelier
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {o.status === "validated" && (
                        <Button size="icon" variant="ghost" onClick={() => deliver(o.id)} title="Livrer">
                          <Truck className="h-4 w-4 text-success" />
                        </Button>
                      )}
                      {o.status === "pending" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            update((s) => ({
                              ...s,
                              orders: s.orders.map((x) =>
                                x.id === o.id ? { ...x, status: "validated" } : x,
                              ),
                            }))
                          }
                          title="Marquer prête"
                        >
                          <Check className="h-4 w-4 text-info" />
                        </Button>
                      )}
                      {o.status !== "cancelled" && o.status !== "delivered" && (
                        <Button size="icon" variant="ghost" onClick={() => cancel(o.id)} title="Annuler">
                          <Ban className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => setInvoice(o)} title="Facture">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => del(o.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!invoice} onOpenChange={(o) => !o && setInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Facture {invoice?.id.slice(-6).toUpperCase()}</DialogTitle>
          </DialogHeader>
          {invoice && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">
                  {state.clients.find((c) => c.id === invoice.clientId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{new Date(invoice.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="flex items-center gap-2">
                {pipelineSteps.map((s, i) => {
                  const order = ["pending", "production", "validated", "delivered"];
                  const done = order.indexOf(invoice.status) >= i;
                  return (
                    <div key={s.key} className="flex items-center gap-2">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center border ${
                          done ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"
                        }`}
                      >
                        <s.icon className="h-3.5 w-3.5" />
                      </div>
                      {i < pipelineSteps.length - 1 && <div className="w-6 h-px bg-border" />}
                    </div>
                  );
                })}
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Unités</TableHead>
                      <TableHead>PU</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((it, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          {it.product} · {it.packSize}
                        </TableCell>
                        <TableCell>{it.units}</TableCell>
                        <TableCell>{it.unitPrice} MAD</TableCell>
                        <TableCell className="text-right">
                          {(it.unitPrice * it.units).toLocaleString("fr-FR")} MAD
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between pt-2 border-t font-semibold text-base">
                <span>Total TTC</span>
                <span>{invoice.total.toLocaleString("fr-FR")} MAD</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
