import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import type { ClientType } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres — DryNuts" },
      { name: "description", content: "Paramètres, référentiels et profil utilisateur." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, update, reset } = useStore();
  const { user } = useAuth();
  const [newProduct, setNewProduct] = useState("");
  const [newFinished, setNewFinished] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newType, setNewType] = useState("");

  const addProduct = () => {
    if (!newProduct.trim()) return;
    update((s) => ({
      ...s,
      settings: { ...s.settings, products: [...s.settings.products, newProduct.trim()] },
    }));
    setNewProduct("");
  };
  const removeProduct = (p: string) =>
    update((s) => ({
      ...s,
      settings: { ...s.settings, products: s.settings.products.filter((x) => x !== p) },
    }));

  const addFinished = () => {
    if (!newFinished.trim()) return;
    update((s) => ({
      ...s,
      settings: {
        ...s.settings,
        finishedProducts: [...s.settings.finishedProducts, newFinished.trim()],
      },
    }));
    setNewFinished("");
  };
  const removeFinished = (p: string) =>
    update((s) => ({
      ...s,
      settings: {
        ...s.settings,
        finishedProducts: s.settings.finishedProducts.filter((x) => x !== p),
      },
    }));

  const addSize = () => {
    if (!newSize.trim()) return;
    update((s) => ({
      ...s,
      settings: { ...s.settings, packSizes: [...s.settings.packSizes, newSize.trim()] },
    }));
    setNewSize("");
  };
  const removeSize = (p: string) =>
    update((s) => ({
      ...s,
      settings: { ...s.settings, packSizes: s.settings.packSizes.filter((x) => x !== p) },
    }));

  const addType = () => {
    if (!newType.trim()) return;
    update((s) => ({
      ...s,
      settings: {
        ...s.settings,
        clientTypes: [...s.settings.clientTypes, newType.trim() as ClientType],
      },
    }));
    setNewType("");
  };
  const removeType = (p: string) =>
    update((s) => ({
      ...s,
      settings: { ...s.settings, clientTypes: s.settings.clientTypes.filter((x) => x !== p) },
    }));

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Référentiels, profil et préférences" />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-1">Types de fruits secs</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Liste utilisée dans les stocks et la production.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {state.settings.products.map((p) => (
              <Badge key={p} variant="secondary" className="gap-1 py-1">
                {p}
                <button onClick={() => removeProduct(p)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newProduct} onChange={(e) => setNewProduct(e.target.value)} placeholder="Ex: Noisettes" />
            <Button onClick={addProduct}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-1">Types de produits finis</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Produits transformés vendables (peuvent différer de la matière première).
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {state.settings.finishedProducts.map((p) => (
              <Badge key={p} variant="secondary" className="gap-1 py-1">
                {p}
                <button onClick={() => removeFinished(p)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newFinished}
              onChange={(e) => setNewFinished(e.target.value)}
              placeholder="Ex: Cheese Nuts"
            />
            <Button onClick={addFinished}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-1">Tailles d'emballage</h3>
          <p className="text-xs text-muted-foreground mb-4">Formats disponibles à la production.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {state.settings.packSizes.map((p) => (
              <Badge key={p} variant="secondary" className="gap-1 py-1">
                {p}
                <button onClick={() => removeSize(p)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="Ex: 750g" />
            <Button onClick={addSize}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-1">Types de clients</h3>
          <p className="text-xs text-muted-foreground mb-4">Segmentation commerciale.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {state.settings.clientTypes.map((p) => (
              <Badge key={p} variant="secondary" className="gap-1 py-1">
                {p}
                <button onClick={() => removeType(p)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="Ex: Export" />
            <Button onClick={addType}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Profil & préférences</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Thème sombre</div>
                <div className="text-xs text-muted-foreground">
                  Interface adaptée aux environnements peu éclairés.
                </div>
              </div>
              <Switch
                checked={state.settings.theme === "dark"}
                onCheckedChange={(v) =>
                  update((s) => ({
                    ...s,
                    settings: { ...s.settings, theme: v ? "dark" : "light" },
                  }))
                }
              />
            </div>
            <Separator />
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm("Réinitialiser toutes les données de démo ?")) {
                    reset();
                    toast.success("Données réinitialisées");
                  }
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Réinitialiser les données mockées
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
