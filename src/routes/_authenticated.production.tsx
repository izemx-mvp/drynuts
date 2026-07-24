import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, genId } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Factory, Play, Plus, Pause, Wrench, Clock } from "lucide-react";
import { toast } from "sonner";
import type { ProductionTask } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/production")({
  head: () => ({
    meta: [
      { title: "Production — DryNuts" },
      { name: "description", content: "Ateliers, tâches en cours et file d'attente de production." },
    ],
  }),
  component: Production,
});

const statusStyle = {
  idle: { label: "Libre", cn: "border-success text-success" },
  running: { label: "En cours", cn: "border-primary text-primary bg-primary/5" },
  paused: { label: "En pause", cn: "border-warning text-warning" },
  maintenance: { label: "Maintenance", cn: "border-muted-foreground text-muted-foreground" },
};

function Production() {
  const { state, update } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    workshopId: "",
    product: "",
    quantityKg: 100,
    packSize: "250g",
    packType: "standard" as "standard" | "custom",
    clientId: "",
  });

  const idleWorkshops = state.workshops.filter((w) => w.status === "idle");

  const submit = () => {
    if (!form.workshopId || !form.product) {
      toast.error("Veuillez sélectionner un atelier et un produit.");
      return;
    }
    const workshop = state.workshops.find((w) => w.id === form.workshopId);
    if (!workshop) return;
    if (workshop.status !== "idle") {
      toast.error(`L'atelier ${workshop.name} est déjà occupé.`);
      return;
    }
    if (form.packType === "custom" && !form.clientId) {
      toast.error("Sélectionnez un client pour l'emballage personnalisé.");
      return;
    }
    const task: ProductionTask = {
      id: genId("task"),
      workshopId: form.workshopId,
      product: form.product,
      quantityKg: Number(form.quantityKg),
      packSize: form.packSize,
      packType: form.packType,
      clientId: form.packType === "custom" ? form.clientId : undefined,
      status: "running",
      progress: 2,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
    };
    update((s) => ({
      ...s,
      tasks: [task, ...s.tasks],
      workshops: s.workshops.map((w) =>
        w.id === form.workshopId ? { ...w, status: "running", currentTaskId: task.id } : w,
      ),
    }));
    toast.success("Tâche lancée");
    setOpen(false);
  };

  const queueByWorkshop = useMemo(() => {
    const map: Record<string, ProductionTask[]> = {};
    for (const t of state.tasks) {
      if (t.status !== "queued") continue;
      (map[t.workshopId] ??= []).push(t);
    }
    return map;
  }, [state.tasks]);

  const pauseResume = (workshopId: string, target: "paused" | "running") =>
    update((s) => ({
      ...s,
      workshops: s.workshops.map((w) => (w.id === workshopId ? { ...w, status: target } : w)),
    }));

  return (
    <div>
      <PageHeader
        title="Ateliers / Production"
        subtitle="Chaque atelier torréfie et emballe une seule tâche à la fois"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" /> Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Lancer une tâche de production</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-1.5">
                  <Label>Atelier disponible</Label>
                  <Select
                    value={form.workshopId}
                    onValueChange={(v) => setForm({ ...form, workshopId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          idleWorkshops.length === 0 ? "Aucun atelier libre" : "Sélectionner…"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {idleWorkshops.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Fruit sec</Label>
                    <Select value={form.product} onValueChange={(v) => setForm({ ...form, product: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner…" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.settings.products.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Quantité (kg)</Label>
                    <Input
                      type="number"
                      value={form.quantityKg}
                      onChange={(e) => setForm({ ...form, quantityKg: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Taille d'emballage</Label>
                    <Select value={form.packSize} onValueChange={(v) => setForm({ ...form, packSize: v })}>
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
                  <div className="space-y-1.5">
                    <Label>Type d'emballage</Label>
                    <Select
                      value={form.packType}
                      onValueChange={(v: "standard" | "custom") => setForm({ ...form, packType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="custom">Personnalisé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {form.packType === "custom" && (
                  <div className="space-y-1.5">
                    <Label>Client destinataire</Label>
                    <Select
                      value={form.clientId}
                      onValueChange={(v) => setForm({ ...form, clientId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner…" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={submit}>Lancer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {state.workshops.map((w) => {
          const task = state.tasks.find((t) => t.id === w.currentTaskId);
          const client = task?.clientId ? state.clients.find((c) => c.id === task.clientId) : null;
          const queue = queueByWorkshop[w.id] ?? [];
          const st = statusStyle[w.status];
          return (
            <Card key={w.id} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Factory className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{w.name}</div>
                    <Badge variant="outline" className={st.cn}>
                      {st.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {task && (w.status === "running" || w.status === "paused") ? (
                <div>
                  <div className="text-sm">
                    <span className="font-medium">{task.product}</span>{" "}
                    <span className="text-muted-foreground">· {task.quantityKg} kg</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Emballage {task.packSize} ·{" "}
                    {task.packType === "custom" ? (
                      <span className="text-info">Personnalisé {client ? `— ${client.name}` : ""}</span>
                    ) : (
                      "Standard"
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Progression</span>
                      <span className="font-medium">{Math.round(task.progress)}%</span>
                    </div>
                    <Progress value={task.progress} />
                    <div className="flex items-center gap-2 mt-3">
                      {w.status === "running" ? (
                        <Button size="sm" variant="outline" onClick={() => pauseResume(w.id, "paused")}>
                          <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => pauseResume(w.id, "running")}>
                          <Play className="h-3.5 w-3.5 mr-1" /> Reprendre
                        </Button>
                      )}
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.max(1, Math.ceil((100 - task.progress) / 4))} min restantes
                      </span>
                    </div>
                  </div>
                </div>
              ) : w.status === "maintenance" ? (
                <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground flex items-center gap-2">
                  <Wrench className="h-4 w-4" /> En maintenance
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground text-center">
                  Aucune tâche en cours
                </div>
              )}

              {queue.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    File d'attente ({queue.length})
                  </div>
                  <div className="space-y-1">
                    {queue.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1.5"
                      >
                        <span>
                          {q.product} · {q.quantityKg} kg · {q.packSize}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {q.packType === "custom" ? "Perso" : "Std"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
