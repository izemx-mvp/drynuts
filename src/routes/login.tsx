import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DEMO_EMAIL, DEMO_PASSWORD, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — DryNuts" },
      { name: "description", content: "Connectez-vous à votre espace DryNuts." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, user, ready } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: "/dashboard" });
  }, [ready, user, navigate]);

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (login(email, password)) {
        toast.success("Connexion réussie");
        navigate({ to: "/dashboard" });
      } else {
        toast.error("Identifiants incorrects");
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary/90 via-primary to-accent/70 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_60%,white,transparent_40%)]" />
        <div className="relative flex items-center gap-3">
          <img src={logo} alt="DryNuts" className="h-12 w-12 object-contain" width={48} height={48} />
          <div>
            <div className="text-2xl font-bold tracking-tight">DryNuts</div>
            <div className="text-xs uppercase tracking-widest opacity-80">Maroc · B2B</div>
          </div>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight max-w-md">
            De la matière première brute au produit torréfié, emballé, vendu.
          </h2>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            Pilotez vos ateliers, votre stock et vos ventes vers BIM, Marjane et vos grossistes
            depuis une seule interface.
          </p>
          <div className="mt-8 flex gap-8 text-sm">
            <div>
              <div className="text-3xl font-bold">6</div>
              <div className="opacity-80">Types de clients</div>
            </div>
            <div>
              <div className="text-3xl font-bold">5</div>
              <div className="opacity-80">Ateliers</div>
            </div>
            <div>
              <div className="text-3xl font-bold">8+</div>
              <div className="opacity-80">Fruits secs</div>
            </div>
          </div>
        </div>
        <div className="relative text-xs opacity-70">© 2026 DryNuts — Version démo</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={logo} alt="DryNuts" className="h-10 w-10" width={40} height={40} />
            <div className="font-bold text-xl">DryNuts</div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Bon retour 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connectez-vous avec les identifiants de démo pré-remplis.
          </p>

          <form onSubmit={handle} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => toast.info("Contactez votre administrateur.")}
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Se connecter
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-dashed p-3 bg-muted/40 text-xs text-muted-foreground">
            <div className="font-medium text-foreground mb-1">Identifiants de démo</div>
            <div>Email : {DEMO_EMAIL}</div>
            <div>Mot de passe : {DEMO_PASSWORD}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
