import { useMemo, useState } from "react";
import { useStore, genId } from "@/lib/store";
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
  AlertTriangle,
  Wheat,
  Package,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import type { ProductionTask, Workshop, WorkshopStatus } from "@/lib/types";
import { addTask, feasibility, finishTask as finishTaskState } from "@/lib/pipeline";

const statusStyle: Record<WorkshopStatus, { label: string; cn: string }> = {
  idle: { label: "Libre", cn: "border-success text-success" },
  running: { label: "En cours", cn: "border-primary text-primary bg-primary/5" },
  paused: { label: "En pause", cn: "border-warning text-warning" },
  maintenance: { label: "Maintenance", cn: "border-muted-foreground text-muted-foreground" },
};

export function WorkshopsPanel() {
  const { state, update } = useStore();

  const [taskOpen, setTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    workshopId: "",
    finishedProduct: "",
    units: 500,
    packSize: "250g",
    packType: "standard" as "standard" | "custom",
    clientId: "",
  });

  const [wsOpen, setWsOpen] = useState(false);
  const [wsEditing, setWsEditing] = useState<Workshop | null>(null);
  const [wsForm, setWsForm] = useState<{ name: string; status: WorkshopStatus }>({
    name: "",
    status: "idle",
  });

  const [detail, setDetail] = useState<{ workshop: Workshop; task: ProductionTask } | null>(null);

  const need = useMemo(
    () =>
      taskForm.finishedProduct
        ? feasibility(
            state,
            taskForm.finishedProduct,
            Number(taskForm.units) || 0,
            taskForm.packSize,
            taskForm.packType,
            taskForm.clientId || undefined,
          )
        : null,
    [state, taskForm],
  );

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
    if (!taskForm.workshopId || !taskForm.finishedProduct) {
      toast.error("Sélectionnez un atelier et un produit final.");
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
    if (Number(taskForm.units) <= 0) {
      toast.error("Indiquez le nombre de paquets à produire.");
      return;
    }
    const busy =
      workshop.status === "running" || workshop.status === "paused" || !!workshop.currentTaskId;
    update((s) =>
      addTask(s, {
        workshopId: taskForm.workshopId,
        finishedProduct: taskForm.finishedProduct,
        units: Number(taskForm.units),
        packSize: taskForm.packSize,
        packType: taskForm.packType,
        clientId: taskForm.packType === "custom" ? taskForm.clientId : undefined,
      }),
    );
    toast.success(busy ? "Ajouté à la file d'attente" : "Production démarrée");
    setTaskOpen(false);
  };

  const pauseResume = (workshopId: string, target: "paused" | "running") =>
    update((s) => ({
      ...s,
      workshops: s.workshops.map((w) => (w.id === workshopId ? { ...w, status: target } : w)),
    }));

  const finish = (task: ProductionTask) => {
    update((s) => finishTaskState(s, task.id));
    setDetail(null);
    toast.success(
      `${task.units} paquets de ${task.finishedProduct} ajoutés — matière et emballage déduits`,
    );
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
      <div className="flex flex-wrap justify-end gap-2 mb-4">
        <Button variant="outline" onClick={openNewWorkshop}>
          <Factory className="h-4 w-4 mr-1" /> Nouvel atelier
        </Button>
        <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" /> Nouvelle production
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Lancer une production</DialogTitle>
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
                          {w.name}{" "}
                          {busy
                            ? "· (file d'attente)"
                            : w.status === "maintenance"
                              ? "· (maintenance)"
                              : "· libre"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Produit final à fabriquer</Label>
                  <Select
                    value={taskForm.finishedProduct}
                    onValueChange={(v) => setTaskForm({ ...taskForm, finishedProduct: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner…" />
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
                <div className="space-y-1.5">
                  <Label>Nombre de paquets</Label>
                  <Input
                    type="number"
                    min={1}
                    value={taskForm.units}
                    onChange={(e) => setTaskForm({ ...taskForm, units: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Taille d'emballage</Label>
                  <Select
                    value={taskForm.packSize}
                    onValueChange={(v) => setTaskForm({ ...taskForm, packSize: v })}
                  >
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
                    value={taskForm.packType}
                    onValueChange={(v: "standard" | "custom") =>
                      setTaskForm({ ...taskForm, packType: v })
                    }
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
              {taskForm.packType === "custom" && (
                <div className="space-y-1.5">
                  <Label>Client destinataire</Label>
                  <Select
                    value={taskForm.clientId}
                    onValueChange={(v) => setTaskForm({ ...taskForm, clientId: v })}
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

              {need && (
                <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Besoins estimés avant lancement
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Wheat className="h-4 w-4 text-primary" /> {need.rawProduct}
                    </span>
                    <span
                      className={
                        need.rawAvailableKg >= need.rawNeededKg
                          ? "text-success font-medium"
                          : "text-destructive font-medium"
                      }
                    >
                      {need.rawNeededKg.toLocaleString("fr-FR")} kg / {need.rawAvailableKg.toLocaleString("fr-FR")} kg dispo
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" /> Emballage {taskForm.packSize}
                    </span>
                    <span
                      className={
                        need.rollsAvailable >= need.rollsNeeded
                          ? "text-success font-medium"
                          : "text-destructive font-medium"
                      }
                    >
                      {need.rollsNeeded} / {need.rollsAvailable} rouleaux dispo
                    </span>
                  </div>
                  {!need.ok && (
                    <div className="flex items-start gap-2 text-xs text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      Stock insuffisant : la production peut être lancée mais devra être
                      réapprovisionnée avant clôture.
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTaskOpen(false)}>
                Annuler
              </Button>
              <Button onClick={submitTask}>Lancer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEditWorkshop(w)}
                    title="Modifier"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteWorkshop(w)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {task && (w.status === "running" || w.status === "paused") ? (
                <div className="rounded-lg border p-3 bg-muted/30">
                  <div className="text-sm">
                    <span className="font-medium">{task.finishedProduct}</span>{" "}
                    <span className="text-muted-foreground">· {task.units} paquets</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {task.quantityKg} kg de {task.product} · emballage {task.packSize} ·{" "}
                    {task.packType === "custom" ? (
                      <span className="text-info">
                        Personnalisé {client ? `— ${client.name}` : ""}
                      </span>
                    ) : (
                      "Standard"
                    )}
                  </div>
                  {task.orderId && (
                    <div className="mt-1.5">
                      <Badge variant="outline" className="text-[10px] border-info text-info">
                        <ShoppingCart className="h-2.5 w-2.5 mr-1" /> Commande{" "}
                        {task.orderId.slice(-6).toUpperCase()}
                      </Badge>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Button size="sm" onClick={() => finish(task)}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Terminer
                    </Button>
                    {w.status === "running" ? (
                      <Button size="sm" variant="outline" onClick={() => pauseResume(w.id, "paused")}>
                        <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pauseResume(w.id, "running")}
                      >
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
                          {q.finishedProduct} · {q.units} paquets · {q.packSize}
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

      {/* Workshop dialog */}
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idle">Libre</SelectItem>
                  <SelectItem value="paused">En pause</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWsOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submitWorkshop}>{wsEditing ? "Enregistrer" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détail de la production</DialogTitle>
          </DialogHeader>
          {detail &&
            (() => {
              const { workshop, task } = detail;
              const client = task.clientId
                ? state.clients.find((c) => c.id === task.clientId)
                : null;
              const rows: [string, string][] = [
                ["Atelier", workshop.name],
                ["Produit final", task.finishedProduct],
                ["Quantité", `${task.units} paquets`],
                ["Matière première", `${task.product} — ${task.quantityKg} kg`],
                [
                  "Emballage",
                  `${task.packSize} · ${task.packType === "custom" ? "Personnalisé" : "Standard"}`,
                ],
                ...(client ? ([["Client", client.name]] as [string, string][]) : []),
                ...(task.orderId
                  ? ([["Commande", task.orderId.slice(-6).toUpperCase()]] as [string, string][])
                  : []),
                ["Statut", task.status],
                ["Créée le", new Date(task.createdAt).toLocaleString("fr-FR")],
                ...(task.startedAt
                  ? ([
                      ["Démarrée le", new Date(task.startedAt).toLocaleString("fr-FR")],
                    ] as [string, string][])
                  : []),
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
                    <Button className="w-full" onClick={() => finish(task)}>
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
