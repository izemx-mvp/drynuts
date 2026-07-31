import { useState } from "react";
import { useStore, genId } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  Handshake,
  Share2,
  HelpCircle,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";

import { toast } from "sonner";
import type { FaqItem, ServiceOffer, SocialLink } from "@/lib/types";


export function CustomerServicePanel() {
  const { state, update } = useStore();
  const cs = state.customerService;

  return (
    <div>

      <Tabs defaultValue="hours">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="hours">
            <Clock className="h-4 w-4 mr-1.5" /> Horaires
          </TabsTrigger>
          <TabsTrigger value="services">
            <Handshake className="h-4 w-4 mr-1.5" /> Services
          </TabsTrigger>
          <TabsTrigger value="socials">
            <Share2 className="h-4 w-4 mr-1.5" /> Réseaux sociaux
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="h-4 w-4 mr-1.5" /> FAQ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hours">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Horaires d'ouverture</h3>
            <div className="space-y-2">
              {cs.hours.map((h, i) => (
                <div
                  key={h.day}
                  className="grid grid-cols-1 sm:grid-cols-[140px_auto_1fr] items-center gap-3 border rounded-lg p-3"
                >
                  <div className="font-medium">{h.day}</div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!h.closed}
                      onCheckedChange={(v) =>
                        update((s) => ({
                          ...s,
                          customerService: {
                            ...s.customerService,
                            hours: s.customerService.hours.map((x, j) =>
                              j === i ? { ...x, closed: !v } : x,
                            ),
                          },
                        }))
                      }
                    />
                    <span className="text-xs text-muted-foreground w-14">
                      {h.closed ? "Fermé" : "Ouvert"}
                    </span>
                  </div>
                  {h.closed ? (
                    <Badge variant="outline" className="w-fit border-muted-foreground text-muted-foreground">
                      Fermé toute la journée
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        className="w-32"
                        value={h.open}
                        onChange={(e) =>
                          update((s) => ({
                            ...s,
                            customerService: {
                              ...s.customerService,
                              hours: s.customerService.hours.map((x, j) =>
                                j === i ? { ...x, open: e.target.value } : x,
                              ),
                            },
                          }))
                        }
                      />
                      <span className="text-muted-foreground text-sm">→</span>
                      <Input
                        type="time"
                        className="w-32"
                        value={h.close}
                        onChange={(e) =>
                          update((s) => ({
                            ...s,
                            customerService: {
                              ...s.customerService,
                              hours: s.customerService.hours.map((x, j) =>
                                j === i ? { ...x, close: e.target.value } : x,
                              ),
                            },
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <ServicesTab />
        </TabsContent>
        <TabsContent value="socials">
          <SocialsTab />
        </TabsContent>
        <TabsContent value="faq">
          <FaqTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Services ---------------- */
function ServicesTab() {
  const { state, update } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceOffer | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Nom du service requis");
      return;
    }
    update((s) => ({
      ...s,
      customerService: {
        ...s.customerService,
        services: editing
          ? s.customerService.services.map((x) => (x.id === editing.id ? { ...x, ...form } : x))
          : [...s.customerService.services, { id: genId("srv"), ...form }],
      },
    }));
    toast.success(editing ? "Service modifié" : "Service ajouté");
    setOpen(false);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Services proposés</h3>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({ name: "", description: "" });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Nouveau service
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {state.customerService.services.length === 0 && (
          <div className="text-sm text-muted-foreground py-6">Aucun service configuré.</div>
        )}
        {state.customerService.services.map((sv) => (
          <div key={sv.id} className="border rounded-lg p-4 flex justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium">{sv.name}</div>
              <p className="text-xs text-muted-foreground mt-1">{sv.description}</p>
            </div>
            <div className="flex items-start gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEditing(sv);
                  setForm({ name: sv.name, description: sv.description });
                  setOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (!confirm(`Supprimer "${sv.name}" ?`)) return;
                  update((s) => ({
                    ...s,
                    customerService: {
                      ...s.customerService,
                      services: s.customerService.services.filter((x) => x.id !== sv.id),
                    },
                  }));
                  toast.success("Supprimé");
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le service" : "Nouveau service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex : Livraison B2B"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Courte description du service"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ---------------- Socials ---------------- */
function SocialsTab() {
  const { state, update } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [form, setForm] = useState({ network: "", url: "" });

  const submit = () => {
    if (!form.network.trim() || !form.url.trim()) {
      toast.error("Nom du réseau et lien requis");
      return;
    }
    update((s) => ({
      ...s,
      customerService: {
        ...s.customerService,
        socials: editing
          ? s.customerService.socials.map((x) => (x.id === editing.id ? { ...x, ...form } : x))
          : [...s.customerService.socials, { id: genId("soc"), ...form }],
      },
    }));
    toast.success(editing ? "Lien modifié" : "Lien ajouté");
    setOpen(false);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Réseaux sociaux</h3>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({ network: "", url: "" });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Nouveau lien
        </Button>
      </div>
      <div className="space-y-2">
        {state.customerService.socials.map((sc) => (
          <div key={sc.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium">{sc.network}</div>
              <a
                href={sc.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 break-all"
              >
                {sc.url} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEditing(sc);
                  setForm({ network: sc.network, url: sc.url });
                  setOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (!confirm(`Supprimer ${sc.network} ?`)) return;
                  update((s) => ({
                    ...s,
                    customerService: {
                      ...s.customerService,
                      socials: s.customerService.socials.filter((x) => x.id !== sc.id),
                    },
                  }));
                  toast.success("Supprimé");
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le lien" : "Nouveau lien"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nom du réseau</Label>
              <Input
                value={form.network}
                onChange={(e) => setForm({ ...form, network: e.target.value })}
                placeholder="Instagram"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Lien</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ---------------- FAQ ---------------- */
function FaqTab() {
  const { state, update } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [form, setForm] = useState({ question: "", answer: "" });

  const submit = () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Question et réponse requises");
      return;
    }
    update((s) => ({
      ...s,
      customerService: {
        ...s.customerService,
        faq: editing
          ? s.customerService.faq.map((x) => (x.id === editing.id ? { ...x, ...form } : x))
          : [...s.customerService.faq, { id: genId("faq"), ...form }],
      },
    }));
    toast.success(editing ? "Question modifiée" : "Question ajoutée");
    setOpen(false);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Questions fréquentes</h3>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({ question: "", answer: "" });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Nouvelle question
        </Button>
      </div>
      <div className="space-y-2">
        {state.customerService.faq.map((f) => (
          <div key={f.id} className="border rounded-lg p-4 flex justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium">{f.question}</div>
              <p className="text-xs text-muted-foreground mt-1">{f.answer}</p>
            </div>
            <div className="flex items-start gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEditing(f);
                  setForm({ question: f.question, answer: f.answer });
                  setOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (!confirm("Supprimer cette question ?")) return;
                  update((s) => ({
                    ...s,
                    customerService: {
                      ...s.customerService,
                      faq: s.customerService.faq.filter((x) => x.id !== f.id),
                    },
                  }));
                  toast.success("Supprimée");
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la question" : "Nouvelle question"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Question</Label>
              <Input
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Réponse</Label>
              <Textarea
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
