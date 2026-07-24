export type ID = string;

export type StockStatus = "ok" | "low" | "out";

export interface RawMaterial {
  id: ID;
  product: string; // e.g. "Amandes"
  quantityKg: number;
  supplierId: ID;
  receivedAt: string; // ISO
  threshold: number;
}

export interface Packaging {
  id: ID;
  label: string; // e.g. "Bobine standard 250g"
  size: string; // "100g" | "250g" ...
  type: "standard" | "custom";
  clientId?: ID; // required if custom
  quantityRolls: number;
  supplierId: ID;
  receivedAt: string;
  threshold: number;
}

export type WorkshopStatus = "idle" | "running" | "paused" | "maintenance";

export interface Workshop {
  id: ID;
  name: string;
  status: WorkshopStatus;
  currentTaskId?: ID;
}

export type TaskStatus = "queued" | "running" | "done";

export interface ProductionTask {
  id: ID;
  workshopId: ID;
  product: string;
  quantityKg: number;
  packSize: string;
  packType: "standard" | "custom";
  clientId?: ID;
  status: TaskStatus;
  progress: number; // 0-100
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface FinishedProduct {
  id: ID;
  product: string;
  packSize: string;
  packType: "standard" | "custom";
  clientId?: ID;
  units: number;
  producedAt: string;
}

export type ClientType =
  | "Gros grossiste"
  | "Petit grossiste"
  | "Demi-gros"
  | "Détaillant"
  | "Point de vente"
  | "Autres";

export interface Client {
  id: ID;
  name: string;
  type: ClientType;
  contact: string;
  phone: string;
  city: string;
}

export interface Supplier {
  id: ID;
  name: string;
  category: string;
  contact: string;
  phone: string;
  city: string;
}

export type OrderStatus = "pending" | "validated" | "delivered" | "cancelled";

export interface OrderItem {
  productId: ID;
  product: string;
  packSize: string;
  packType: "standard" | "custom";
  units: number;
  unitPrice: number;
}

export interface Order {
  id: ID;
  clientId: ID;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Settings {
  products: string[];
  packSizes: string[];
  clientTypes: ClientType[];
  theme: "light" | "dark";
}

export interface AppState {
  rawMaterials: RawMaterial[];
  packaging: Packaging[];
  workshops: Workshop[];
  tasks: ProductionTask[];
  finished: FinishedProduct[];
  clients: Client[];
  suppliers: Supplier[];
  orders: Order[];
  settings: Settings;
}
