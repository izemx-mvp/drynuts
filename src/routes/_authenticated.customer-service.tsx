import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { useStore, genId } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
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
  Bot,
  Plus,
  Pencil,
  Trash2,
  Send,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { FaqItem, ServiceOffer, SocialLink } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/customer-service")({
  head: () => ({
    meta: [
      { title: "Service Client — DryNuts" },
      {
        name: "description",
        content:
          "Horaires, services, réseaux sociaux, FAQ et assistant IA du service client DryNuts.",
      },
    ],
  }),
  component: CustomerServicePage,
});

function CustomerServicePage() {
  const { state, update } = useStore();
  const cs = state.customerService;

  return (
    <div>
      <PageHeader
        title="Service Client"
        subtitle="Informations publiques de l'entreprise et assistant conversationnel"
      />

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
          <TabsTrigger value="assistant">
            <Bot className="h-4 w-4 mr-1.5" /> Assistant IA
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
        <TabsContent value="assistant">
          <AssistantTab />
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

/* ---------------- Assistant ---------------- */
type ChatMsg = { id: string; role: "user" | "bot"; text: string };

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function AssistantTab() {
  const { state } = useStore();
  const cs = state.customerService;
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Bonjour 👋 Je suis l'assistant DryNuts. Posez-moi une question sur nos horaires, nos services, nos réseaux sociaux ou consultez notre FAQ.",
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    inputRef.current?.focus();
  }, [messages]);

  const hoursText = useMemo(
    () =>
      cs.hours
        .map((h) => `• ${h.day} : ${h.closed ? "Fermé" : `${h.open} – ${h.close}`}`)
        .join("\n"),
    [cs.hours],
  );

  const answer = (raw: string): string => {
    const q = normalize(raw);

    // FAQ match first (word overlap)
    const words = q.split(/\W+/).filter((w) => w.length > 3);
    let best: { item: FaqItem; score: number } | null = null;
    for (const item of cs.faq) {
      const target = normalize(item.question + " " + item.answer);
      const score = words.filter((w) => target.includes(w)).length;
      if (score >= 2 && (!best || score > best.score)) best = { item, score };
    }

    if (/(horaire|heure|ouvert|ouvrez|ferme|fermeture|dimanche|samedi)/.test(q)) {
      return `Voici nos horaires d'ouverture :\n${hoursText}`;
    }
    if (/(service|proposez|offrez|marque blanche|personnalis|livraison|gros)/.test(q)) {
      return cs.services.length
        ? `Nos services :\n${cs.services.map((s) => `• ${s.name} — ${s.description}`).join("\n")}`
        : "Aucun service n'est configuré pour le moment.";
    }
    if (/(instagram|facebook|linkedin|whatsapp|reseau|social|page|suivre)/.test(q)) {
      return cs.socials.length
        ? `Retrouvez-nous ici :\n${cs.socials.map((s) => `• ${s.network} : ${s.url}`).join("\n")}`
        : "Aucun réseau social n'est configuré pour le moment.";
    }
    if (best) return best.item.answer;
    if (/(bonjour|salut|hello|bonsoir)/.test(q)) return "Bonjour ! Comment puis-je vous aider ?";
    if (/(merci)/.test(q)) return "Avec plaisir ! Autre chose ?";

    return `Je n'ai pas trouvé de réponse précise. Vous pouvez me demander :\n• Quels sont vos horaires ?\n• Quels services proposez-vous ?\n• Avez-vous une page Instagram ?\n${cs.faq
      .slice(0, 3)
      .map((f) => `• ${f.question}`)
      .join("\n")}`;
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMsg = { id: genId("msg"), role: "user", text };
    const botMsg: ChatMsg = { id: genId("msg"), role: "bot", text: answer(text) };
    setMessages((m) => [...m, userMsg, botMsg]);
    setInput("");
  };

  const suggestions = [
    "Quels sont vos horaires ?",
    "Quels services proposez-vous ?",
    "Avez-vous une page Instagram ?",
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">Assistant service client</h3>
          <p className="text-xs text-muted-foreground">
            Répond à partir des horaires, services, réseaux sociaux et FAQ configurés ci-dessus.
          </p>
        </div>
      </div>

      <div className="border rounded-lg h-[420px] overflow-y-auto p-4 space-y-3 bg-muted/20">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground whitespace-pre-line"
                  : "max-w-[85%] rounded-lg px-3 py-2 text-sm bg-card border text-foreground whitespace-pre-line"
              }
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {suggestions.map((s) => (
          <Button
            key={s}
            size="sm"
            variant="outline"
            onClick={() => {
              setMessages((m) => [
                ...m,
                { id: genId("msg"), role: "user", text: s },
                { id: genId("msg"), role: "bot", text: answer(s) },
              ]);
            }}
          >
            {s}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Posez votre question…"
        />
        <Button onClick={send}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
