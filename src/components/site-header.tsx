import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Flame, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useSession } from "@/lib/session-context";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/mapa", label: "Mapa de risco" },
  { to: "/acompanhar", label: "Acompanhar denúncia" },
  { to: "/prevencao", label: "Prevenção" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const session = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-forest bg-leaf-soft" }}
            >
              {n.label}
            </Link>
          ))}
          <Link
            to="/equipe"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            activeProps={{ className: "text-forest bg-leaf-soft" }}
          >
            Área da equipe
          </Link>
          {session && (
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sair
            </Button>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="alert" size="sm" className="h-10 px-4">
            <Link to="/denunciar">
              <Flame /> Denunciar
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="border-t lg:hidden" aria-label="Menu móvel">
          <div className="container-page flex flex-col py-2">
            {[...NAV, { to: "/equipe", label: "Área da equipe" } as const].map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium hover:bg-muted"
              >
                {n.label}
              </Link>
            ))}
            {session && (
              <button onClick={signOut} className="rounded-lg px-3 py-3 text-left text-base font-medium hover:bg-muted">
                Sair
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
