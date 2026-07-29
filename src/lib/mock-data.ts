import type { AppState, ClientType } from "./types";

const uid = (p: string, i: number) => `${p}-${i.toString().padStart(3, "0")}`;

const products = [
  "Amandes",
  "Noix",
  "Pistaches",
  "Cacahuètes",
  "Noix de cajou",
  "Raisins secs",
  "Figues séchées",
  "Dattes",
];

const finishedProducts = [
  "Amandes nature",
  "Amandes grillées salées",
  "Noix de cajou nature",
  "Cheese Nuts",
  "Honey Nuts",
  "Spicy Mix",
  "Mélange apéritif",
  "Dattes fourrées",
  "Autres",
];

const packSizes = ["100g", "250g", "500g", "1kg", "2kg"];

const clientTypes: ClientType[] = [
  "Gros grossiste",
  "Petit grossiste",
  "Demi-gros",
  "Détaillant",
  "Point de vente",
  "Autres",
];

const suppliers = [
  { id: "sup-001", name: "Coopérative Souss", kind: "raw" as const, category: "Amandes / Noix", contact: "Youssef Amrani", phone: "+212 528 22 10 11", city: "Agadir" },
  { id: "sup-002", name: "Atlas Dried Fruits", kind: "raw" as const, category: "Multi-produits", contact: "Sara Bennis", phone: "+212 535 44 55 66", city: "Fès" },
  { id: "sup-003", name: "Sahara Palm Co.", kind: "raw" as const, category: "Dattes / Figues", contact: "Karim Idrissi", phone: "+212 524 33 21 09", city: "Errachidia" },
  { id: "sup-004", name: "Packaging Maroc SA", kind: "packaging" as const, category: "Emballage standard", contact: "Nadia El Fassi", phone: "+212 522 55 11 22", city: "Casablanca" },
  { id: "sup-005", name: "PrintPack Rabat", kind: "packaging" as const, category: "Emballage personnalisé", contact: "Mehdi Chraibi", phone: "+212 537 66 77 88", city: "Rabat" },
];

import type { Client } from "./types";
const clients: Client[] = [
  { id: "cli-001", name: "BIM Maroc", type: "Autres", contact: "Direction Achats", phone: "+212 522 00 11 22", city: "Casablanca" },
  { id: "cli-002", name: "Marjane Holding", type: "Autres", contact: "Service Fournisseurs", phone: "+212 522 33 44 55", city: "Casablanca" },
  { id: "cli-003", name: "Duty Free Mohammed V", type: "Autres", contact: "Ahmed Tazi", phone: "+212 522 99 88 77", city: "Casablanca" },
  { id: "cli-004", name: "Grossiste Derb Omar", type: "Gros grossiste", contact: "Hassan Alaoui", phone: "+212 522 30 40 50", city: "Casablanca" },
  { id: "cli-005", name: "Nour Distribution", type: "Petit grossiste", contact: "Fatima Zahra", phone: "+212 535 12 34 56", city: "Fès" },
  { id: "cli-006", name: "Épicerie Al Massira", type: "Détaillant", contact: "Omar Benali", phone: "+212 524 55 66 77", city: "Marrakech" },
  { id: "cli-007", name: "Mini-Market Anfa", type: "Point de vente", contact: "Rachid Kabbaj", phone: "+212 522 88 99 00", city: "Casablanca" },
  { id: "cli-008", name: "Demi-Gros Rabat", type: "Demi-gros", contact: "Leila Berrada", phone: "+212 537 22 33 44", city: "Rabat" },
  { id: "cli-009", name: "Souk Al Had", type: "Détaillant", contact: "Said Mansouri", phone: "+212 528 66 77 88", city: "Agadir" },
  { id: "cli-010", name: "Distribution Nord", type: "Petit grossiste", contact: "Amine Cherkaoui", phone: "+212 539 44 55 66", city: "Tanger" },
];

const workshops = [
  { id: "atl-001", name: "Atelier A1 — Torréfaction Nord", status: "running" as const, currentTaskId: "task-001" },
  { id: "atl-002", name: "Atelier A2 — Torréfaction Sud", status: "running" as const, currentTaskId: "task-002" },
  { id: "atl-003", name: "Atelier B1 — Ligne Premium", status: "idle" as const },
  { id: "atl-004", name: "Atelier B2 — Ligne Rapide", status: "paused" as const, currentTaskId: "task-003" },
  { id: "atl-005", name: "Atelier C1 — Personnalisé", status: "maintenance" as const },
];

const now = Date.now();
const iso = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();

const rawMaterials = [
  { id: uid("raw", 1), product: "Amandes", quantityKg: 1250, supplierId: "sup-001", receivedAt: iso(3), threshold: 300 },
  { id: uid("raw", 2), product: "Noix", quantityKg: 480, supplierId: "sup-001", receivedAt: iso(5), threshold: 200 },
  { id: uid("raw", 3), product: "Pistaches", quantityKg: 220, supplierId: "sup-002", receivedAt: iso(2), threshold: 250 },
  { id: uid("raw", 4), product: "Cacahuètes", quantityKg: 2100, supplierId: "sup-002", receivedAt: iso(1), threshold: 500 },
  { id: uid("raw", 5), product: "Noix de cajou", quantityKg: 640, supplierId: "sup-002", receivedAt: iso(7), threshold: 200 },
  { id: uid("raw", 6), product: "Raisins secs", quantityKg: 340, supplierId: "sup-003", receivedAt: iso(4), threshold: 200 },
  { id: uid("raw", 7), product: "Figues séchées", quantityKg: 180, supplierId: "sup-003", receivedAt: iso(6), threshold: 150 },
  { id: uid("raw", 8), product: "Dattes", quantityKg: 950, supplierId: "sup-003", receivedAt: iso(2), threshold: 300 },
  { id: uid("raw", 9), product: "Amandes", quantityKg: 90, supplierId: "sup-001", receivedAt: iso(10), threshold: 300 },
  { id: uid("raw", 10), product: "Pistaches", quantityKg: 60, supplierId: "sup-002", receivedAt: iso(12), threshold: 250 },
];

const packaging = [
  { id: uid("pkg", 1), label: "Sachet standard 100g", size: "100g", type: "standard" as const, quantityRolls: 40, supplierId: "sup-004", receivedAt: iso(4), threshold: 10 },
  { id: uid("pkg", 2), label: "Sachet standard 250g", size: "250g", type: "standard" as const, quantityRolls: 55, supplierId: "sup-004", receivedAt: iso(4), threshold: 10 },
  { id: uid("pkg", 3), label: "Sachet standard 500g", size: "500g", type: "standard" as const, quantityRolls: 32, supplierId: "sup-004", receivedAt: iso(6), threshold: 8 },
  { id: uid("pkg", 4), label: "Sachet standard 1kg", size: "1kg", type: "standard" as const, quantityRolls: 20, supplierId: "sup-004", receivedAt: iso(8), threshold: 5 },
  { id: uid("pkg", 5), label: "Emballage BIM 250g", size: "250g", type: "custom" as const, clientId: "cli-001", quantityRolls: 28, supplierId: "sup-005", receivedAt: iso(2), threshold: 5 },
  { id: uid("pkg", 6), label: "Emballage BIM 500g", size: "500g", type: "custom" as const, clientId: "cli-001", quantityRolls: 15, supplierId: "sup-005", receivedAt: iso(2), threshold: 5 },
  { id: uid("pkg", 7), label: "Emballage Marjane 250g", size: "250g", type: "custom" as const, clientId: "cli-002", quantityRolls: 22, supplierId: "sup-005", receivedAt: iso(3), threshold: 5 },
  { id: uid("pkg", 8), label: "Emballage Marjane 1kg", size: "1kg", type: "custom" as const, clientId: "cli-002", quantityRolls: 8, supplierId: "sup-005", receivedAt: iso(5), threshold: 4 },
  { id: uid("pkg", 9), label: "Emballage Duty Free 100g", size: "100g", type: "custom" as const, clientId: "cli-003", quantityRolls: 12, supplierId: "sup-005", receivedAt: iso(9), threshold: 5 },
  { id: uid("pkg", 10), label: "Sachet standard 2kg", size: "2kg", type: "standard" as const, quantityRolls: 3, supplierId: "sup-004", receivedAt: iso(15), threshold: 5 },
];

const tasks = [
  { id: "task-001", workshopId: "atl-001", product: "Amandes", quantityKg: 200, packSize: "250g", packType: "standard" as const, status: "running" as const, progress: 62, createdAt: iso(0), startedAt: iso(0) },
  { id: "task-002", workshopId: "atl-002", product: "Cacahuètes", quantityKg: 350, packSize: "500g", packType: "custom" as const, clientId: "cli-001", status: "running" as const, progress: 34, createdAt: iso(0), startedAt: iso(0) },
  { id: "task-003", workshopId: "atl-004", product: "Pistaches", quantityKg: 80, packSize: "100g", packType: "custom" as const, clientId: "cli-002", status: "running" as const, progress: 45, createdAt: iso(0), startedAt: iso(0) },
  { id: "task-004", workshopId: "atl-001", product: "Noix", quantityKg: 100, packSize: "250g", packType: "standard" as const, status: "queued" as const, progress: 0, createdAt: iso(0) },
  { id: "task-005", workshopId: "atl-003", product: "Dattes", quantityKg: 120, packSize: "500g", packType: "standard" as const, status: "queued" as const, progress: 0, createdAt: iso(0) },
];

const finished = [
  { id: uid("fin", 1), product: "Amandes", packSize: "250g", packType: "standard" as const, units: 820, producedAt: iso(1) },
  { id: uid("fin", 2), product: "Amandes", packSize: "500g", packType: "standard" as const, units: 410, producedAt: iso(2) },
  { id: uid("fin", 3), product: "Noix", packSize: "250g", packType: "standard" as const, units: 300, producedAt: iso(3) },
  { id: uid("fin", 4), product: "Cacahuètes", packSize: "100g", packType: "standard" as const, units: 1500, producedAt: iso(1) },
  { id: uid("fin", 5), product: "Cacahuètes", packSize: "500g", packType: "standard" as const, units: 640, producedAt: iso(4) },
  { id: uid("fin", 6), product: "Pistaches", packSize: "250g", packType: "standard" as const, units: 210, producedAt: iso(2) },
  { id: uid("fin", 7), product: "Noix de cajou", packSize: "250g", packType: "standard" as const, units: 380, producedAt: iso(5) },
  { id: uid("fin", 8), product: "Raisins secs", packSize: "500g", packType: "standard" as const, units: 260, producedAt: iso(3) },
  { id: uid("fin", 9), product: "Dattes", packSize: "1kg", packType: "standard" as const, units: 180, producedAt: iso(6) },
  { id: uid("fin", 10), product: "Figues séchées", packSize: "250g", packType: "standard" as const, units: 140, producedAt: iso(7) },
  // custom stock reserved for BIM
  { id: uid("fin", 11), product: "Amandes", packSize: "250g", packType: "custom" as const, clientId: "cli-001", units: 900, producedAt: iso(2) },
  { id: uid("fin", 12), product: "Cacahuètes", packSize: "500g", packType: "custom" as const, clientId: "cli-001", units: 1200, producedAt: iso(1) },
  { id: uid("fin", 13), product: "Noix de cajou", packSize: "250g", packType: "custom" as const, clientId: "cli-001", units: 340, producedAt: iso(3) },
  // custom stock reserved for Marjane
  { id: uid("fin", 14), product: "Pistaches", packSize: "250g", packType: "custom" as const, clientId: "cli-002", units: 500, producedAt: iso(2) },
  { id: uid("fin", 15), product: "Amandes", packSize: "1kg", packType: "custom" as const, clientId: "cli-002", units: 220, producedAt: iso(4) },
  { id: uid("fin", 16), product: "Dattes", packSize: "500g", packType: "custom" as const, clientId: "cli-002", units: 310, producedAt: iso(1) },
  // Duty Free
  { id: uid("fin", 17), product: "Noix de cajou", packSize: "100g", packType: "custom" as const, clientId: "cli-003", units: 600, producedAt: iso(3) },
  { id: uid("fin", 18), product: "Amandes", packSize: "100g", packType: "custom" as const, clientId: "cli-003", units: 480, producedAt: iso(5) },
  { id: uid("fin", 19), product: "Pistaches", packSize: "500g", packType: "standard" as const, units: 90, producedAt: iso(8) },
  { id: uid("fin", 20), product: "Noix", packSize: "1kg", packType: "standard" as const, units: 60, producedAt: iso(9) },
];

const orderStatuses = ["pending", "validated", "delivered", "cancelled"] as const;

const orders = [
  { clientId: "cli-004", items: [{ product: "Amandes", packSize: "250g", units: 120, unitPrice: 28 }], status: "delivered" },
  { clientId: "cli-005", items: [{ product: "Cacahuètes", packSize: "500g", units: 200, unitPrice: 18 }, { product: "Raisins secs", packSize: "500g", units: 80, unitPrice: 22 }], status: "validated" },
  { clientId: "cli-001", items: [{ product: "Amandes", packSize: "250g", units: 400, unitPrice: 26, packType: "custom" as const }], status: "delivered" },
  { clientId: "cli-002", items: [{ product: "Pistaches", packSize: "250g", units: 250, unitPrice: 45, packType: "custom" as const }], status: "pending" },
  { clientId: "cli-006", items: [{ product: "Noix", packSize: "250g", units: 40, unitPrice: 32 }], status: "delivered" },
  { clientId: "cli-007", items: [{ product: "Dattes", packSize: "1kg", units: 25, unitPrice: 55 }], status: "validated" },
  { clientId: "cli-008", items: [{ product: "Noix de cajou", packSize: "250g", units: 100, unitPrice: 48 }], status: "pending" },
  { clientId: "cli-009", items: [{ product: "Figues séchées", packSize: "250g", units: 30, unitPrice: 26 }], status: "delivered" },
  { clientId: "cli-010", items: [{ product: "Cacahuètes", packSize: "100g", units: 300, unitPrice: 6 }], status: "cancelled" },
  { clientId: "cli-004", items: [{ product: "Amandes", packSize: "500g", units: 180, unitPrice: 52 }], status: "validated" },
  { clientId: "cli-001", items: [{ product: "Cacahuètes", packSize: "500g", units: 500, unitPrice: 16, packType: "custom" as const }], status: "delivered" },
  { clientId: "cli-002", items: [{ product: "Amandes", packSize: "1kg", units: 100, unitPrice: 95, packType: "custom" as const }], status: "delivered" },
  { clientId: "cli-003", items: [{ product: "Noix de cajou", packSize: "100g", units: 200, unitPrice: 22, packType: "custom" as const }], status: "validated" },
  { clientId: "cli-005", items: [{ product: "Pistaches", packSize: "500g", units: 60, unitPrice: 90 }], status: "pending" },
  { clientId: "cli-006", items: [{ product: "Raisins secs", packSize: "250g", units: 50, unitPrice: 12 }], status: "delivered" },
  { clientId: "cli-008", items: [{ product: "Amandes", packSize: "250g", units: 90, unitPrice: 28 }], status: "delivered" },
  { clientId: "cli-010", items: [{ product: "Noix", packSize: "1kg", units: 40, unitPrice: 120 }], status: "validated" },
];

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const customerService = {
  hours: days.map((day) => ({
    day,
    closed: day === "Dimanche",
    open: day === "Samedi" ? "09:00" : "08:00",
    close: day === "Samedi" ? "13:00" : "18:00",
  })),
  services: [
    { id: "srv-001", name: "Vente en gros", description: "Fruits secs conditionnés en grandes quantités pour grossistes et distributeurs." },
    { id: "srv-002", name: "Marque blanche / emballage personnalisé", description: "Production sous votre marque avec bobines d'emballage à votre identité visuelle." },
    { id: "srv-003", name: "Livraison B2B", description: "Livraison sur tout le Maroc pour les commandes professionnelles validées." },
    { id: "srv-004", name: "Torréfaction à façon", description: "Torréfaction et aromatisation (Cheese, Honey, Spicy) selon votre cahier des charges." },
  ],
  socials: [
    { id: "soc-001", network: "Facebook", url: "https://facebook.com/drynuts.ma" },
    { id: "soc-002", network: "Instagram", url: "https://instagram.com/drynuts.ma" },
    { id: "soc-003", network: "LinkedIn", url: "https://linkedin.com/company/drynuts" },
    { id: "soc-004", network: "WhatsApp Business", url: "https://wa.me/212600000000" },
  ],
  faq: [
    { id: "faq-001", question: "Quelle est la quantité minimale de commande ?", answer: "La commande minimale est de 50 unités pour le stock standard et de 200 unités pour un emballage personnalisé." },
    { id: "faq-002", question: "Proposez-vous des emballages à notre marque ?", answer: "Oui, nous produisons en marque blanche : vos bobines personnalisées sont réservées à votre stock et ne sont jamais utilisées pour un autre client." },
    { id: "faq-003", question: "Quels sont les délais de livraison ?", answer: "Comptez 48 à 72h après validation de la commande pour l'axe Casablanca-Rabat, 3 à 5 jours pour le reste du Maroc." },
    { id: "faq-004", question: "Quels moyens de paiement acceptez-vous ?", answer: "Virement bancaire, chèque et espèces à la livraison pour les clients référencés." },
  ],
};

export const initialState: AppState = {
  rawMaterials,
  packaging,
  workshops,
  tasks,
  finished,
  clients,
  suppliers,
  orders: orders.map((o, i) => {
    const items = o.items.map((it, j) => ({
      productId: uid(`prd`, i * 10 + j),
      product: it.product,
      packSize: it.packSize,
      packType: (it as { packType?: "standard" | "custom" }).packType ?? "standard",
      units: it.units,
      unitPrice: it.unitPrice,
    }));
    return {
      id: uid("ord", i + 1),
      clientId: o.clientId,
      items,
      total: items.reduce((s, it) => s + it.units * it.unitPrice, 0),
      status: o.status as typeof orderStatuses[number],
      createdAt: iso(i),
    };
  }),
  customerService,
  settings: {
    products,
    finishedProducts,
    packSizes,
    clientTypes,
    theme: "light",
  },
};
