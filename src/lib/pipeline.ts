import type { AppState, FinishedProduct, Order, ProductionTask } from "./types";

export const UNITS_PER_ROLL = 500;

/** grams contained in a pack size label ("250g", "1kg") */
export function gramsOf(packSize: string): number {
  const n = parseFloat(packSize);
  if (Number.isNaN(n)) return 250;
  return packSize.toLowerCase().includes("kg") ? n * 1000 : n;
}

/** raw material required (kg) to produce `units` packs of `packSize` */
export function rawKgFor(units: number, packSize: string): number {
  return Math.round(((units * gramsOf(packSize)) / 1000) * 100) / 100;
}

/** rolls of packaging required for `units` packs */
export function rollsFor(units: number): number {
  return Math.max(1, Math.ceil(units / UNITS_PER_ROLL));
}

/** raw material used to make a given finished product */
export function rawOf(state: AppState, finishedProduct: string): string {
  return state.settings.recipes?.[finishedProduct] ?? state.settings.products[0] ?? "Amandes";
}

export function rawStockKg(state: AppState, rawProduct: string): number {
  return state.rawMaterials
    .filter((r) => r.product === rawProduct)
    .reduce((s, r) => s + r.quantityKg, 0);
}

export function packagingRolls(
  state: AppState,
  packSize: string,
  packType: "standard" | "custom",
  clientId?: string,
): number {
  return state.packaging
    .filter(
      (p) =>
        p.size === packSize &&
        p.type === packType &&
        (packType === "custom" ? p.clientId === clientId : true),
    )
    .reduce((s, p) => s + p.quantityRolls, 0);
}

/** finished units available for a client (standard stock + its own reserved stock) */
export function availableUnits(
  state: AppState,
  product: string,
  packSize: string,
  packType: "standard" | "custom",
  clientId?: string,
): number {
  return state.finished
    .filter(
      (f) =>
        f.product === product &&
        f.packSize === packSize &&
        f.packType === packType &&
        (packType === "custom" ? f.clientId === clientId : true),
    )
    .reduce((s, f) => s + f.units, 0);
}

/** does the client have custom packaging for this size? => production is reserved */
export function packTypeForClient(
  state: AppState,
  clientId: string,
  packSize: string,
): "standard" | "custom" {
  return state.packaging.some(
    (p) => p.type === "custom" && p.clientId === clientId && p.size === packSize,
  )
    ? "custom"
    : "standard";
}

export interface Feasibility {
  rawProduct: string;
  rawNeededKg: number;
  rawAvailableKg: number;
  rollsNeeded: number;
  rollsAvailable: number;
  ok: boolean;
}

export function feasibility(
  state: AppState,
  finishedProduct: string,
  units: number,
  packSize: string,
  packType: "standard" | "custom",
  clientId?: string,
): Feasibility {
  const rawProduct = rawOf(state, finishedProduct);
  const rawNeededKg = rawKgFor(units, packSize);
  const rawAvailableKg = rawStockKg(state, rawProduct);
  const rollsNeeded = rollsFor(units);
  const rollsAvailable = packagingRolls(state, packSize, packType, clientId);
  return {
    rawProduct,
    rawNeededKg,
    rawAvailableKg,
    rollsNeeded,
    rollsAvailable,
    ok: rawAvailableKg >= rawNeededKg && rollsAvailable >= rollsNeeded,
  };
}

const nowIso = () => new Date().toISOString();
const rid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** pick the workshop with the shortest queue (never one in maintenance) */
export function pickWorkshop(state: AppState): string | undefined {
  const candidates = state.workshops.filter((w) => w.status !== "maintenance");
  if (candidates.length === 0) return undefined;
  const load = (id: string) =>
    state.tasks.filter((t) => t.workshopId === id && t.status !== "done").length;
  return [...candidates].sort((a, b) => load(a.id) - load(b.id))[0].id;
}

/** create a production task (auto-start if the workshop is free, else queue it) */
export function addTask(
  state: AppState,
  input: {
    workshopId: string;
    finishedProduct: string;
    units: number;
    packSize: string;
    packType: "standard" | "custom";
    clientId?: string;
    orderId?: string;
  },
): AppState {
  const workshop = state.workshops.find((w) => w.id === input.workshopId);
  if (!workshop) return state;
  const busy = !!workshop.currentTaskId || workshop.status === "running" || workshop.status === "paused";
  const task: ProductionTask = {
    id: rid("task"),
    workshopId: input.workshopId,
    finishedProduct: input.finishedProduct,
    product: rawOf(state, input.finishedProduct),
    units: input.units,
    quantityKg: rawKgFor(input.units, input.packSize),
    packSize: input.packSize,
    packType: input.packType,
    clientId: input.clientId,
    orderId: input.orderId,
    status: busy ? "queued" : "running",
    progress: busy ? 0 : 50,
    createdAt: nowIso(),
    startedAt: busy ? undefined : nowIso(),
  };
  return {
    ...state,
    tasks: [task, ...state.tasks],
    workshops: busy
      ? state.workshops
      : state.workshops.map((w) =>
          w.id === input.workshopId ? { ...w, status: "running" as const, currentTaskId: task.id } : w,
        ),
  };
}

/** finish a task: consume raw (FIFO) + packaging, create finished stock, promote the queue */
export function finishTask(state: AppState, taskId: string): AppState {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return state;

  let remaining = task.quantityKg;
  const rawMaterials = [...state.rawMaterials]
    .sort((a, b) => (a.receivedAt < b.receivedAt ? -1 : 1))
    .map((r) => {
      if (remaining <= 0 || r.product !== task.product) return r;
      const take = Math.min(r.quantityKg, remaining);
      remaining = Math.round((remaining - take) * 100) / 100;
      return { ...r, quantityKg: Math.round((r.quantityKg - take) * 100) / 100 };
    });

  let rollsLeft = rollsFor(task.units);
  const packaging = state.packaging.map((p) => {
    if (rollsLeft <= 0) return p;
    const match =
      p.size === task.packSize &&
      p.type === task.packType &&
      (task.packType === "custom" ? p.clientId === task.clientId : true);
    if (!match || p.quantityRolls <= 0) return p;
    const take = Math.min(p.quantityRolls, rollsLeft);
    rollsLeft -= take;
    return { ...p, quantityRolls: p.quantityRolls - take };
  });

  const produced: FinishedProduct = {
    id: rid("fin"),
    product: task.finishedProduct,
    packSize: task.packSize,
    packType: task.packType,
    clientId: task.clientId,
    units: task.units,
    producedAt: nowIso(),
  };

  const nextTask = state.tasks.find(
    (x) => x.workshopId === task.workshopId && x.status === "queued" && x.id !== taskId,
  );
  const tasks = state.tasks.map((t) => {
    if (t.id === taskId)
      return { ...t, status: "done" as const, progress: 100, finishedAt: nowIso() };
    if (nextTask && t.id === nextTask.id)
      return { ...t, status: "running" as const, progress: 50, startedAt: nowIso() };
    return t;
  });
  const workshops = state.workshops.map((w) =>
    w.id === task.workshopId
      ? {
          ...w,
          currentTaskId: nextTask?.id,
          status: nextTask ? ("running" as const) : ("idle" as const),
        }
      : w,
  );

  const next: AppState = {
    ...state,
    rawMaterials,
    packaging,
    finished: [produced, ...state.finished],
    tasks,
    workshops,
  };
  return refreshOrders(next);
}

/** an order is ready as soon as every line is covered by available finished stock */
export function orderCovered(state: AppState, order: Order): boolean {
  return order.items.every(
    (it) =>
      availableUnits(state, it.product, it.packSize, it.packType, order.clientId) >= it.units,
  );
}

/** move orders waiting on production to "validated" once their stock exists */
export function refreshOrders(state: AppState): AppState {
  return {
    ...state,
    orders: state.orders.map((o) =>
      o.status === "production" && orderCovered(state, o) ? { ...o, status: "validated" } : o,
    ),
  };
}

/** create an order and automatically launch production for any missing quantity */
export function placeOrder(state: AppState, order: Order): AppState {
  let next: AppState = { ...state, orders: [{ ...order, status: "pending" }, ...state.orders] };
  let launched = 0;

  for (const it of order.items) {
    const have = availableUnits(next, it.product, it.packSize, it.packType, order.clientId);
    const missing = it.units - have;
    if (missing <= 0) continue;
    const workshopId = pickWorkshop(next);
    if (!workshopId) continue;
    next = addTask(next, {
      workshopId,
      finishedProduct: it.product,
      units: missing,
      packSize: it.packSize,
      packType: it.packType,
      clientId: it.packType === "custom" ? order.clientId : undefined,
      orderId: order.id,
    });
    launched++;
  }

  next = {
    ...next,
    orders: next.orders.map((o) =>
      o.id === order.id ? { ...o, status: launched > 0 ? "production" : "validated" } : o,
    ),
  };
  return next;
}

/** deliver an order: consume the finished stock (FIFO on production date) */
export function deliverOrder(state: AppState, orderId: string): AppState {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return state;

  let finished = [...state.finished].sort((a, b) => (a.producedAt < b.producedAt ? -1 : 1));
  for (const it of order.items) {
    let remaining = it.units;
    finished = finished.map((f) => {
      if (remaining <= 0) return f;
      const match =
        f.product === it.product &&
        f.packSize === it.packSize &&
        f.packType === it.packType &&
        (it.packType === "custom" ? f.clientId === order.clientId : true);
      if (!match || f.units <= 0) return f;
      const take = Math.min(f.units, remaining);
      remaining -= take;
      return { ...f, units: f.units - take };
    });
  }

  return {
    ...state,
    finished: finished.filter((f) => f.units > 0),
    orders: state.orders.map((o) => (o.id === orderId ? { ...o, status: "delivered" } : o)),
  };
}
