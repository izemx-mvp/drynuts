import { useMemo, useState } from "react";
import { useStore, genId } from "@/lib/store";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Ban,
  Trash2,
  FileText,
  Lock,
  X,
  Truck,
  Wheat,
  LayoutGrid,
  Rows3,
  ChevronRight,
  Zap,
  Eye,
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
import { OrderDetail, ORDER_FLOW } from "./OrderDetail";

const statusMeta: Record<OrderStatus, { label: string; cn: string }> = {
  pending: { label: "Reçue", cn: "border-muted-foreground text-muted-foreground" },
  production: { label: "En production", cn: "border-warning text-warning" },
  validated: { label: "Prête", cn: "border-info text-info" },
  delivered: { label: "Livrée", cn: "border-success text-success" },
  cancelled: { label: "Annulée", cn: "border-destructive text-destructive" },
};

export function OrdersPanel() {
  const { state, update } = useStore();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [clientType, setClientType] = useState<string>("all");
  const [openNew, setOpenNew] = useState(false);
  const [invoice, setInvoice] = useState<Order | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);

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

  // keep the open detail in sync with the live store
  const liveDetail = detail ? (state.orders.find((o) => o.id === detail.id) ?? null) : null;

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

  const cancelled = filtered.filter((o) => o.status === "cancelled");

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "table")}>
          <TabsList>
            <TabsTrigger value="kanban">
              <LayoutGrid className="h-4 w-4 mr-1.5" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="table">
              <Rows3 className="h-4 w-4 mr-1.5" /> Tableau
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto">
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
                              <span>À produire automatiquement</span>
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
        </div>
      </div>

      <Card className="p-4 mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher…"
            className="pl-9"
          />
        </div>
        {view === "table" && (
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
        )}
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

      {view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {ORDER_FLOW.map((col, ci) => {
            const list = filtered.filter((o) => o.status === col.key);
            return (
              <div key={col.key} className="min-w-0">
                <Card className="p-3 mb-3 relative overflow-hidden">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <col.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {ci + 1}. {col.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {list.length} commande(s)
                      </div>
                    </div>
                    {ci < ORDER_FLOW.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                    )}
                  </div>
                  <div className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground leading-snug">
                    <Zap className="h-3 w-3 mt-0.5 text-accent shrink-0" />
                    <span>{col.auto}</span>
                  </div>
                </Card>

                <div className="space-y-2">
                  {list.length === 0 && (
                    <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                      Vide
                    </div>
                  )}
                  {list.map((o) => {
                    const client = state.clients.find((c) => c.id === o.clientId);
                    const openTasks = state.tasks.filter(
                      (t) => t.orderId === o.id && t.status !== "done",
                    ).length;
                    return (
                      <Card
                        key={o.id}
                        onClick={() => setDetail(o)}
                        className="glow-card p-3 cursor-pointer transition-transform duration-300 ease-[var(--ease-spring)] hover:-translate-y-0.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {client?.name ?? "—"}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              #{o.id.slice(-6)} ·{" "}
                              {new Date(o.createdAt).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                          <Badge variant="outline" className={statusMeta[o.status].cn}>
                            {statusMeta[o.status].label}
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                          {o.items
                            .map((it) => `${it.product} ${it.packSize}×${it.units}`)
                            .join(", ")}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-semibold text-sm">
                            {o.total.toLocaleString("fr-FR")} MAD
                          </span>
                          {openTasks > 0 && (
                            <span className="text-[10px] text-warning">
                              {openTasks} tâche(s) atelier
                            </span>
                          )}
                        </div>
                        {o.status === "validated" && (
                          <Button
                            size="sm"
                            className="w-full mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              deliver(o.id);
                            }}
                          >
                            <Truck className="h-3.5 w-3.5 mr-1" /> Livrer
                          </Button>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {cancelled.length > 0 && (
            <div className="xl:col-span-4">
              <div className="text-xs text-muted-foreground mb-2">
                Annulées ({cancelled.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {cancelled.map((o) => (
                  <Badge
                    key={o.id}
                    variant="outline"
                    className="cursor-pointer border-destructive text-destructive"
                    onClick={() => setDetail(o)}
                  >
                    #{o.id.slice(-6)} ·{" "}
                    {state.clients.find((c) => c.id === o.clientId)?.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
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
                  <TableRow
                    key={o.id}
                    className="hover:bg-muted/40 cursor-pointer"
                    onClick={() => setDetail(o)}
                  >
                    <TableCell className="font-mono text-xs">{o.id.slice(-6)}</TableCell>
                    <TableCell className="font-medium">{client?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{client?.type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {o.items.map((it) => `${it.product} ${it.packSize}×${it.units}`).join(", ")}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {o.total.toLocaleString("fr-FR")} MAD
                    </TableCell>
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
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDetail(o)}
                          title="Détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {o.status === "validated" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deliver(o.id)}
                            title="Livrer"
                          >
                            <Truck className="h-4 w-4 text-success" />
                          </Button>
                        )}
                        {o.status !== "cancelled" && o.status !== "delivered" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => cancel(o.id)}
                            title="Annuler"
                          >
                            <Ban className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setInvoice(o)}
                          title="Facture"
                        >
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
      )}

      <OrderDetail
        order={liveDetail}
        onClose={() => setDetail(null)}
        onDeliver={(id) => {
          deliver(id);
        }}
        onCancel={(id) => cancel(id)}
        onInvoice={(o) => {
          setDetail(null);
          setInvoice(o);
        }}
      />

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
