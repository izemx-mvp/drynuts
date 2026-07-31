import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Headphones, HelpCircle, Clock, Share2 } from "lucide-react";
import { CustomerServicePanel } from "@/components/panels/CustomerServicePanel";

export const Route = createFileRoute("/_authenticated/service")({
  head: () => ({
    meta: [
      { title: "Service Client — DryNuts" },
      {
        name: "description",
        content:
          "Horaires d'ouverture, services proposés, réseaux sociaux et FAQ du service client DryNuts.",
      },
      { property: "og:title", content: "Service Client — DryNuts" },
      {
        property: "og:description",
        content: "La relation client DryNuts : horaires, services, réseaux et FAQ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicePage,
});

function ServicePage() {
  const { state } = useStore();
  const cs = state.customerService;

  const summary = [
    {
      label: "Jours ouverts",
      value: `${cs.hours.filter((h) => !h.closed).length}/7`,
      icon: Clock,
      tone: "primary" as const,
    },
    {
      label: "Services proposés",
      value: `${cs.services.length}`,
      icon: Headphones,
      tone: "accent" as const,
    },
    { label: "Réseaux sociaux", value: `${cs.socials.length}`, icon: Share2, tone: "info" as const },
    { label: "Questions FAQ", value: `${cs.faq.length}`, icon: HelpCircle, tone: "success" as const },
  ];

  return (
    <div className="section-accent">
      <PageHeader
        title="Service Client"
        subtitle="Horaires, services, réseaux sociaux et FAQ — tout l'aval de la relation client"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {summary.map((s, i) => (
          <Card
            key={s.label}
            className="glow-card p-4 flex items-center gap-3 animate-rise"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`tone-chip tone-${s.tone}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold tracking-tight truncate">{s.value}</div>
              <div className="text-xs text-muted-foreground truncate">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <CustomerServicePanel />
    </div>
  );
}
