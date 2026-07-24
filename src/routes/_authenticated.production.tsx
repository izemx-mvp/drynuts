import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, genId } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Factory,
  Plus,
  Pause,
  Play,
  Wrench,
  CheckCircle2,
  Pencil,
  Trash2,
  ListOrdered,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import type { ProductionTask, Workshop, WorkshopStatus } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/production")({
  head: () => ({
    meta: [
      { title: "Ateliers / Production — DryNuts" },
      { name: "description", content: "Gestion des ateliers, tâches en cours et file d'attente." },
    ],
  }),
  component: Production,
});

const statusStyle: Record<WorkshopStatus, { label: string; cn: string }> = {
  idle: { label: "Libre", cn: "border-success text-success" },
  running: { label: "En cours", cn: "border-primary text-primary bg-primary/5" },
  paused: { label: "En pause", cn: "border-warning text-warning" },
  maintenance: { label: "Maintenance", cn: "border-muted-foreground text-muted-foreground" },
};

function Production() {
  const { state, update } = useStore();

  // ---------- new task ----------
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    workshopId: "",
    product: "",
    quantityKg: 100,
    packSize: "250g",
    packType: "standard" as "standard" | "custom",
    clientId: "",
  });

  // ---------- workshop CRUD ----------
  const [wsOpen, setWsOpen] = useState(false);
  const [wsEditing, setWsEditing] = useState<Workshop | null>(null);
  const [wsForm, setWsForm] = useState<{ name: string; status: WorkshopStatus }>({
    name: "",
    status: "idle",
  });

  const [detail, setDetail] = useState<{ workshop: Workshop; task: ProductionTask } | null>(null);

  const openNewWorkshop = () => {
    setWsEditing(null);
    setWsForm({ name: "", status: "idle" });
    setWsOpen(true);
  };
  const openEditWorkshop = (w: Workshop) => {
    setWsEditing(w);
    setWsForm({ name: w.name, status: w.status });
    setWsOpen(true);
  };
  const submitWorkshop = () => {
    if (!wsForm.name.trim()) {
      toast.error("Nom d'atelier requis");
      return;
    }
    if (wsEditing) {
      update((s) => ({
        ...s,
        workshops: s.workshops.map((w) =>
          w.id === wsEditing.id ? { ...w, name: wsForm.name, status: wsForm.status } : w,
        ),
      }));
      toast.success("Atelier mis à jour");
    } else {
      const w: Workshop = { id: genId("atl"), name: wsForm.name, status: wsForm.status };
      update((s) => ({ ...s, workshops: [...s.workshops, w] }));
      toast.success("Atelier créé");
    }
    setWsOpen(false);
  };
  const deleteWorkshop = (w: Workshop) => {
    if (w.currentTaskId || state.tasks.some((t) => t.workshopId === w.id && t.status !== "done")) {
      toast.error("Impossible : l'atelier a des tâches en cours ou en file.");
      return;
    }
    if (!confirm(`Supprimer ${w.name} ?`)) return;
    update((s) => ({ ...s, workshops: s.workshops.filter((x) => x.id !== w.id) }));
    toast.success("Supprimé");
  };

  const submitTask = () => {
    if (!taskForm.workshopId || !taskForm.product) {
      toast.error("Sélectionnez un atelier et un produit.");
      return;
    }
    const workshop = state.workshops.find((w) => w.id === taskForm.workshopId);
    if (!workshop) return;
    if (workshop.status === "maintenance") {
      toast.error(`${workshop.name} est en maintenance.`);
      return;
    }
    if (taskForm.packType === "custom" && !taskForm.clientId) {
      toast.error("Sélectionnez un client pour l'emballage personnalisé.");
      return;
    }
    const busy = workshop.status === "running" || workshop.status === "paused" || !!workshop.currentTaskId;
    const task: ProductionTask = {
      id: genId("task"),
      workshopId: taskForm.workshopId,
      product: taskForm.product,
      quantityKg: Number(taskForm.quantityKg),
      packSize: taskForm.packSize,
      packType: taskForm.packType,
      clientId: taskForm.packType === "custom" ? taskForm.clientId : undefined,
      status: busy ? "queued" : "running",
      progress: busy ? 0 : 50,
      createdAt: new Date().toISOString(),
      startedAt: busy ? undefined : new Date().toISOString(),
    };
    update((s) => ({
      ...s,
      tasks: [task, ...s.tasks],
      workshops: busy
        ? s.workshops
        : s.workshops.map((w) =>
            w.id === taskForm.workshopId ? { ...w, status: "running", currentTaskId: task.id } : w,
          ),
    }));
    toast.success(busy ? "Ajouté à la file d'attente" : "Tâche démarrée");
    setTaskOpen(false);
  };

  const pauseResume = (workshopId: string, target: "paused" | "running") =>
    update((s) => ({
      ...s,
      workshops: s.workshops.map((w) => (w.id === workshopId ? { ...w, status: target } : w)),
    }));

  // ---------- finish task: deduct raw + packaging, add finished, promote queue ----------
  const finishTask = (workshopId: string, taskId: string) => {
    update((s) => {
      const task = s.tasks.find((t) => t.id === taskId);
      if (!task) return s;

      // deduct raw material (FIFO by receivedAt asc)
      let remaining = task.quantityKg;
      const rawMaterials = [...s.rawMaterials]
        .sort((a, b) => (a.receivedAt < b.receivedAt ? -1 : 1))
        .map((r) => {
          if (remaining <= 0 || r.product !== task.product) return r;
          const take = Math.min(r.quantityKg, remaining);
          remaining -= take;
          return { ...r, quantityKg: r.quantityKg - take };
        });

      // deduct 1 roll of matching packaging
      let deducted = false;
      const packaging = s.packaging.map((p) => {
        if (deducted) return p;
        const matchType = p.type === task.packType;
        const matchClient = task.packType === "custom" ? p.clientId === task.clientId : true;
        if (matchType && matchClient && p.size === task.packSize && p.quantityRolls > 0) {
          deducted = true;
          return { ...p, quantityRolls: p.quantityRolls - 1 };
        }
        return p;
      });

      // finished product units estimation
      const gramsPerPack = task.packSize.includes("kg")
        ? parseFloat(task.packSize) * 1000
        : parseFloat(task.packSize);
      const units = Math.max(1, Math.floor((task.quantityKg * 1000) / (gramsPerPack || 250)));

      const newFinished = {
        id: `fin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        product: task.product,
        packSize: task.packSize,
        packType: task.packType,
        clientId: task.clientId,
        units,
        producedAt: new Date().toISOString(),
      };

      // mark task done & promote next queued
      const nextTask = s.tasks.find(
        (x) => x.workshopId === workshopId && x.status === "queued" && x.id !== taskId,
      );
      const tasks = s.tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, status: "done" as const, progress: 100, finishedAt: new Date().toISOString() };
        }
        if (nextTask && t.id === nextTask.id) {
          return { ...t, status: "running" as const, progress: 50, startedAt: new Date().toISOString() };
        }
        return t;
      });
      const workshops = s.workshops.map((w) =>
        w.id === workshopId
          ? {
              ...w,
              currentTaskId: nextTask?.id,
              status: nextTask ? ("running" as const) : ("idle" as const),
            }
          : w,
      );

      return {
        ...s,
        rawMaterials,
        packaging,
        finished: [newFinished, ...s.finished],
        tasks,
        workshops,
      };
    });
    toast.success("Tâche terminée — stocks mis à jour");
  };

  const queueByWorkshop = useMemo(() => {
    const map: Record<string, ProductionTask[]> = {};
    for (const t of state.tasks) {
      if (t.status !== "queued") continue;
      (map[t.workshopId] ??= []).push(t);
    }
    return map;
  }, [state.tasks]);

  return (
    <div>
      <PageHeader
        title="Ateliers / Production"
        subtitle="Créez des ateliers, assignez des tâches et clôturez-les manuellement"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={openNewWorkshop}>
              <Factory className="h-4 w-4 mr-1" /> Nouvel atelier
            </Button>
            <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" /> Nouvelle tâche
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Assigner une tâche de production</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Atelier</Label>
                    <Select
                      value={taskForm.workshopId}
                      onValueChange={(v) => setTaskForm({ ...taskForm, workshopId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner…" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.workshops.map((w) => {
                          const busy = w.status === "running" || w.status === "paused";
                          return (
                            <SelectItem key={w.id} value={w.id} disabled={w.status === "maintenance"}>
                              {w.name} {busy ? "· (file d'attente)" : w.status === "maintenance" ? "· (maintenance)" : "· libre"}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Fruit sec</Label>
                      <Select value={taskForm.product} onValueChange={(v) => setTaskForm({ ...taskForm, product: v })}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                        <SelectContent>
                          {state.settings.products.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Quantité (kg)</Label>
                      <Input
                        type="number"
                        value={taskForm.quantityKg}
                        onChange={(e) => setTaskForm({ ...taskForm, quantityKg: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Taille d'emballage</Label>
                      <Select value={taskForm.packSize} onValueChange={(v) => setTaskForm({ ...taskForm, packSize: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {state.settings.packSizes.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Type d'emballage</Label>
                      <Select
                        value={taskForm.packType}
                        onValueChange={(v: "standard" | "custom") => setTaskForm({ ...taskForm, packType: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="custom">Personnalisé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {taskForm.packType === "custom" && (
                    <div className="space-y-1.5">
                      <Label>Client destinataire</Label>
                      <Select value={taskForm.clientId} onValueChange={(v) => setTaskForm({ ...taskForm, clientId: v })}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                        <SelectContent>
                          {state.clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTaskOpen(false)}>Annuler</Button>
                  <Button onClick={submitTask}>Assigner</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
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
                    <Badge variant="outline" className={st.cn}>{st.label}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEditWorkshop(w)} title="Modifier">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteWorkshop(w)} title="Supprimer">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {task && (w.status === "running" || w.status === "paused") ? (
                <div className="rounded-lg border p-3 bg-muted/30">
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
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Button size="sm" onClick={() => finishTask(w.id, task.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Terminer
                    </Button>
                    {w.status === "running" ? (
                      <Button size="sm" variant="outline" onClick={() => pauseResume(w.id, "paused")}>
                        <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => pauseResume(w.id, "running")}>
                        <Play className="h-3.5 w-3.5 mr-1" /> Reprendre
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setDetail({ workshop: w, task })}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Détail
                    </Button>
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
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ListOrdered className="h-3 w-3" /> File d'attente ({queue.length})
                  </div>
                  <div className="space-y-1">
                    {queue.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1.5"
                      >
                        <span className="truncate">
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

      {/* Workshop CRUD dialog */}
      <Dialog open={wsOpen} onOpenChange={setWsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{wsEditing ? "Modifier l'atelier" : "Nouvel atelier"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input
                value={wsForm.name}
                onChange={(e) => setWsForm({ ...wsForm, name: e.target.value })}
                placeholder="Atelier D1 — …"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select
                value={wsForm.status}
                onValueChange={(v: WorkshopStatus) => setWsForm({ ...wsForm, status: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="idle">Libre</SelectItem>
                  <SelectItem value="paused">En pause</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWsOpen(false)}>Annuler</Button>
            <Button onClick={submitWorkshop}>{wsEditing ? "Enregistrer" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détail de la tâche</DialogTitle>
          </DialogHeader>
          {detail && (() => {
            const { workshop, task } = detail;
            const client = task.clientId ? state.clients.find((c) => c.id === task.clientId) : null;
            const rows: [string, string][] = [
              ["Atelier", workshop.name],
              ["Produit", task.product],
              ["Quantité", `${task.quantityKg} kg`],
              ["Emballage", `${task.packSize} · ${task.packType === "custom" ? "Personnalisé" : "Standard"}`],
              ...(client ? ([["Client", client.name]] as [string, string][]) : []),
              ["Statut", task.status],
              ["Créée le", new Date(task.createdAt).toLocaleString("fr-FR")],
              ...(task.startedAt ? ([["Démarrée le", new Date(task.startedAt).toLocaleString("fr-FR")]] as [string, string][]) : []),
            ];
            return (
              <div className="grid gap-1.5 text-sm">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b py-1.5">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-right">{v}</span>
                  </div>
                ))}
                <div className="pt-3">
                  <Button className="w-full" onClick={() => { finishTask(workshop.id, task.id); setDetail(null); }}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Marquer terminée
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
