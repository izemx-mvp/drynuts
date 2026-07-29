import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Lock, Boxes, Trash2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { FinishedProduct } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/finished")({
  head: () => ({
    meta: [
      { title: "Produits finis — DryNuts" },
      {
        name: "description",
        content: "Stock produits finis : stock commun standard et stock réservé par client.",
      },
    ],
  }),
  component: FinishedPage,
});

function FinishedPage() {
  const { state, update } = useStore();
  const [q, setQ] = useState("");
  const [product, setProduct] = useState<string>("all");
  const [size, setSize] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [editing, setEditing] = useState<FinishedProduct | null>(null);
  const [units, setUnits] = useState(0);
  const [editProduct, setEditProduct] = useState("");

  // finished product types = configured list + any type already present in stock
  const productTypes = useMemo(() => {
    const set = new Set<string>(state.settings.finishedProducts ?? []);
    state.finished.forEach((f) => set.add(f.product));
    return [...set];
  }, [state.settings.finishedProducts, state.finished]);

  const filter = (list: FinishedProduct[]) =>
    list.filter(
      (f) =>
        (product === "all" || f.product === product) &&
        (size === "all" || f.packSize === size) &&
        (!q.trim() || f.product.toLowerCase().includes(q.toLowerCase())),
    );

  const standard = useMemo(
    () => filter(state.finished.filter((f) => f.packType === "standard")),
    [state.finished, q, product, size],
  );

  const customByClient = useMemo(() => {
    const map: Record<string, FinishedProduct[]> = {};
    const list = filter(
      state.finished.filter(
        (f) => f.packType === "custom" && (clientFilter === "all" || f.clientId === clientFilter),
      ),
    );
    for (const f of list) {
      const key = f.clientId ?? "unknown";
      (map[key] ??= []).push(f);
    }
    return map;
  }, [state.finished, q, product, size, clientFilter]);

  const del = (id: string) => {
    if (!confirm("Supprimer ce lot ?")) return;
    update((s) => ({ ...s, finished: s.finished.filter((f) => f.id !== id) }));
    toast.success("Lot supprimé");
  };

  const save = () => {
    if (!editing) return;
    update((s) => ({
      ...s,
      finished: s.finished.map((f) =>
        f.id === editing.id ? { ...f, units, product: editProduct || f.product } : f,
      ),
    }));
    toast.success("Lot mis à jour");
    setEditing(null);
  };

  const Row = ({ f }: { f: FinishedProduct }) => (
    <div className="flex items-center justify-between border rounded-lg p-3 bg-card hover:bg-muted/30 transition">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-lg bg-accent/30 flex items-center justify-center shrink-0">
          <Boxes className="h-4 w-4 text-accent-foreground" />
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate">
            {f.product} · {f.packSize}
          </div>
          <div className="text-xs text-muted-foreground">
            Lot créé le {new Date(f.producedAt).toLocaleDateString("fr-FR")}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <div className="font-semibold">{f.units.toLocaleString("fr-FR")}</div>
          <div className="text-[11px] text-muted-foreground">unités</div>
        </div>
        <Badge
          variant="outline"
          className={f.units > 0 ? "border-success text-success" : "border-destructive text-destructive"}
        >
          {f.units > 0 ? "Disponible" : "Épuisé"}
        </Badge>
        <Button
          size="icon"
          variant="ghost"
          title="Ajuster le lot"
          onClick={() => {
            setEditing(f);
            setUnits(f.units);
            setEditProduct(f.product);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" title="Supprimer" onClick={() => del(f.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Stock produits finis"
        subtitle="Stock commun (standard) et stock réservé par client (emballage personnalisé)"
      />

      <Card className="p-4 mb-6 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit fini…"
            className="pl-9"
          />
        </div>
        <Select value={product} onValueChange={setProduct}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Type de produit fini" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les produits finis</SelectItem>
            {productTypes.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={size} onValueChange={setSize}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Taille" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes tailles</SelectItem>
            {state.settings.packSizes.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Client (stock réservé)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les clients</SelectItem>
            {state.clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5 border-l-4 border-l-success">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Stock commun · Standard</h3>
              <p className="text-xs text-muted-foreground">Vendable à n'importe quel client</p>
            </div>
            <Badge className="bg-success text-success-foreground">
              {standard.reduce((s, f) => s + f.units, 0).toLocaleString("fr-FR")} u.
            </Badge>
          </div>
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {standard.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">Aucun produit</div>
            )}
            {standard.map((f) => (
              <Row key={f.id} f={f} />
            ))}
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-info">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4 text-info" /> Stock réservé · Personnalisé
              </h3>
              <p className="text-xs text-muted-foreground">
                Groupé par client, non vendable ailleurs
              </p>
            </div>
          </div>
          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
            {Object.keys(customByClient).length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">
                Aucun stock personnalisé
              </div>
            )}
            {Object.entries(customByClient).map(([clientId, list]) => {
              const client = state.clients.find((c) => c.id === clientId);
              return (
                <div key={clientId}>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-info text-info-foreground">
                      Réservé — {client?.name ?? "Client inconnu"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {list.reduce((s, f) => s + f.units, 0).toLocaleString("fr-FR")} u.
                    </span>
                  </div>
                  <div className="space-y-2">
                    {list.map((f) => (
                      <Row key={f.id} f={f} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuster le lot</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {editing.packSize} ·{" "}
                {editing.packType === "custom"
                  ? `Personnalisé — ${state.clients.find((c) => c.id === editing.clientId)?.name ?? "Client"}`
                  : "Standard"}
              </div>
              <div className="space-y-1.5">
                <Label>Type de produit fini</Label>
                <Select value={editProduct} onValueChange={setEditProduct}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unités</Label>
                <Input
                  type="number"
                  value={units}
                  onChange={(e) => setUnits(Number(e.target.value))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Annuler
            </Button>
            <Button onClick={save}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
