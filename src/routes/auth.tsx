import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/session-context";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Área da equipe · Alerta Verde" },
      { name: "description", content: "Acesso restrito para a equipe que recebe e atende as denúncias do Alerta Verde." },
      { property: "og:title", content: "Área da equipe — Alerta Verde" },
      { property: "og:description", content: "Acesso restrito da equipe de atendimento às denúncias de incêndio em Itabirito." },
    ],
  }),
  component: AuthPage,
});

const GoogleG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
);

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate({ to: "/equipe", replace: true });
  }, [session, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) toast.error("E-mail ou senha incorretos, ou e-mail ainda não confirmado.");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/equipe` },
        });
        if (error) toast.error(error.message);
        else {
          toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) toast.error(error.message);
        else toast.success("Se o e-mail estiver cadastrado, você receberá um link para criar nova senha.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function social(provider: "google" | "lovable") {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error("Não foi possível entrar agora.");
  }

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-14">
      <div className="card-surface w-full max-w-md p-8">
        <ShieldCheck className="size-10 text-forest" />
        <h1 className="mt-4 text-3xl font-semibold text-forest-deep">
          {mode === "signup" ? "Criar conta da equipe" : mode === "forgot" ? "Recuperar senha" : "Área da equipe"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acesso restrito a quem recebe e atende as denúncias. Moradores não precisam de conta para denunciar.
        </p>

        {mode !== "forgot" && (
          <div className="mt-6 grid gap-3">
            <Button type="button" variant="google" size="lg" onClick={() => social("google")}>
              <GoogleG /> Continuar com Google
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => social("lovable")}>
              <LovableMark className="size-[18px]" /> Continuar com Lovable
            </Button>
            <div className="my-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> ou com e-mail <span className="h-px flex-1 bg-border" />
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
          </Button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-sm">
          {mode === "signin" ? (
            <>
              <button className="text-left text-forest hover:underline" onClick={() => setMode("signup")}>Ainda não tem conta? Criar conta</button>
              <button className="text-left text-muted-foreground hover:underline" onClick={() => setMode("forgot")}>Esqueci minha senha</button>
            </>
          ) : (
            <button className="text-left text-forest hover:underline" onClick={() => setMode("signin")}>Voltar para entrar</button>
          )}
          <Link to="/denunciar" className="mt-2 text-muted-foreground hover:underline">Quero apenas denunciar um incêndio →</Link>
        </div>
      </div>
    </div>
  );
}
