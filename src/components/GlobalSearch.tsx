import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Users, ShoppingCart, Truck, Boxes, Wheat } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

export function GlobalSearch() {
  const { state } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const match = (s: string) => s.toLowerCase().includes(q.trim().toLowerCase());

  const results = useMemo(() => {
    const term = q.trim();
    const clients = state.clients.filter((c) => !term || match(c.name) || match(c.city));
    const orders = state.orders.filter((o) => {
      const c = state.clients.find((x) => x.id === o.clientId);
      return !term || match(o.id) || match(c?.name ?? "");
    });
    const suppliers = state.suppliers.filter((s) => !term || match(s.name) || match(s.category));
    const finished = state.finished.filter((f) => !term || match(f.product) || match(f.packSize));
    const raw = state.rawMaterials.filter((r) => !term || match(r.product));
    return { clients, orders, suppliers, finished, raw };
  }, [q, state]);

  const goCommercial = (tab: "clients" | "orders") => {
    setOpen(false);
    navigate({ to: "/commercial", search: { tab } });
  };
  const goProduction = (tab: "raw" | "packaging" | "workshops" | "finished") => {
    setOpen(false);
    navigate({ to: "/production", search: { tab } });
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full max-w-sm justify-start gap-2 text-muted-foreground font-normal bg-[var(--surface-2)] tactile"
      >
        <Search className="h-4 w-4" />
        <span className="truncate">Rechercher clients, commandes, stock…</span>
        <kbd className="ml-auto hidden sm:inline text-[10px] rounded border px-1.5 py-0.5">⌘K</kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          value={q}
          onValueChange={setQ}
          placeholder="Rechercher dans toute l'application…"
        />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          {results.clients.length > 0 && (
            <CommandGroup heading="Clients">
              {results.clients.slice(0, 6).map((c) => (
                <CommandItem key={c.id} value={`client ${c.name} ${c.city}`} onSelect={() => goCommercial("clients")}>
                  <Users className="h-4 w-4 text-primary" />
                  <span>{c.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{c.city}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results.orders.length > 0 && (
            <CommandGroup heading="Commandes">
              {results.orders.slice(0, 6).map((o) => {
                const c = state.clients.find((x) => x.id === o.clientId);
                return (
                  <CommandItem key={o.id} value={`commande ${o.id} ${c?.name ?? ""}`} onSelect={() => goCommercial("orders")}>
                    <ShoppingCart className="h-4 w-4 text-[var(--ember)]" />
                    <span>{c?.name ?? o.clientId}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {o.total.toLocaleString("fr-FR")} MAD
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
          {results.finished.length > 0 && (
            <CommandGroup heading="Produits finis">
              {results.finished.slice(0, 6).map((f) => (
                <CommandItem key={f.id} value={`fini ${f.product} ${f.packSize}`} onSelect={() => goProduction("finished")}>
                  <Boxes className="h-4 w-4 text-info" />
                  <span>
                    {f.product} · {f.packSize}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">{f.units} pqts</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results.raw.length > 0 && (
            <CommandGroup heading="Matière première">
              {results.raw.slice(0, 6).map((r) => (
                <CommandItem key={r.id} value={`matiere ${r.product}`} onSelect={() => goProduction("raw")}>
                  <Wheat className="h-4 w-4 text-warning" />
                  <span>{r.product}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{r.quantityKg} kg</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results.suppliers.length > 0 && (
            <CommandGroup heading="Fournisseurs">
              {results.suppliers.slice(0, 6).map((s) => (
                <CommandItem
                  key={s.id}
                  value={`fournisseur ${s.name} ${s.category}`}
                  onSelect={() => {
                    setOpen(false);
                    navigate({ to: "/partners" });
                  }}
                >
                  <Truck className="h-4 w-4 text-success" />
                  <span>{s.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{s.category}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
