import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Circle, FileSearch, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackReport, type TrackedReport } from "@/lib/reports.functions";
import { loadMyReports, type SavedReport } from "@/lib/my-reports";
import { STATUS_HINT, STATUS_LABEL, formatDateTime } from "@/lib/report-status";
import { regionName } from "@/lib/regions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/acompanhar")({
  validateSearch: z.object({ protocolo: z.string().max(40).optional() }),
  head: () => ({
    meta: [
      { title: "Acompanhar denúncia — Alerta Verde Itabirito" },
      { name: "description", content: "Consulte o andamento da sua denúncia de incêndio pelo número de protocolo." },
      { property: "og:title", content: "Acompanhar denúncia — Alerta Verde" },
      { property: "og:description", content: "Veja o histórico e o status do atendimento da sua denúncia em Itabirito–MG." },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const search = Route.useSearch();
  const [protocol, setProtocol] = useState(search.protocolo ?? "");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TrackedReport | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mine, setMine] = useState<SavedReport[]>([]);
  const track = useServerFn(trackReport);

  async function lookup(p: string) {
    const value = p.trim().toUpperCase();
    if (value.length < 6) return setMessage("Digite o protocolo completo, por exemplo AV-260101-1A2B3C4D.");
    setLoading(true);
    setMessage(null);
    try {
      const res = await track({ data: { protocol: value } });
      setReport(res.report);
      if (res.error) setMessage(res.error);
      else if (!res.report) setMessage("Nenhuma denúncia encontrada com esse protocolo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMine(loadMyReports());
    if (search.protocolo) lookup(search.protocolo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container-page py-12">
      <div className="max-w-2xl">
        <span className="eyebrow">Histórico e acompanhamento</span>
        <h1 className="mt-3 text-4xl font-semibold text-forest-deep md:text-5xl">Acompanhar denúncia</h1>
        <p className="mt-3 text-muted-foreground">Digite o protocolo recebido ao enviar a denúncia para ver o andamento.</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <form
            className="card-surface flex flex-col gap-3 p-5 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              lookup(protocol);
            }}
          >
            <Input
              aria-label="Número do protocolo"
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              placeholder="AV-260101-1A2B3C4D"
              className="h-11 font-mono uppercase"
              maxLength={40}
            />
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Search />} Consultar
            </Button>
          </form>

          {message && <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">{message}</p>}

          {report && (
            <article className="card-surface p-6 md:p-8 animate-rise">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Protocolo</div>
                  <div className="font-mono text-xl font-bold text-forest-deep">{report.protocol}</div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-semibold",
                    report.status === "resolvida" ? "bg-leaf-soft text-forest" : report.status === "descartada" ? "bg-muted text-muted-foreground" : "bg-fire-soft text-fire",
                  )}
                >
                  {STATUS_LABEL[report.status]}
                </span>
              </div>
              <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Enviada em</dt>
                  <dd className="font-semibold">{formatDateTime(report.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Região</dt>
                  <dd className="font-semibold">{regionName(report.region_id)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Fotos enviadas</dt>
                  <dd className="font-semibold">{report.photo_count}</dd>
                </div>
              </dl>
              <h2 className="mt-8 font-sans text-base font-bold">Histórico</h2>
              <ol className="mt-4 space-y-5">
                {report.updates.map((u, i) => {
                  const last = i === report.updates.length - 1;
                  return (
                    <li key={i} className="flex gap-3">
                      {last ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-forest" /> : <Circle className="mt-0.5 size-5 shrink-0 text-border" />}
                      <div>
                        <div className="font-semibold">{STATUS_LABEL[u.status]}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(u.created_at)}</div>
                        <p className="mt-1 text-sm text-muted-foreground">{u.note || STATUS_HINT[u.status]}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </article>
          )}
        </div>

        <aside className="card-surface h-fit p-6">
          <h2 className="flex items-center gap-2 font-sans text-base font-bold">
            <FileSearch className="size-5 text-forest" /> Minhas denúncias neste aparelho
          </h2>
          {mine.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhuma denúncia enviada deste aparelho ainda.{" "}
              <Link to="/denunciar" className="font-semibold text-forest underline">Fazer uma denúncia</Link>
            </p>
          ) : (
            <ul className="mt-4 divide-y">
              {mine.map((m) => (
                <li key={m.protocol}>
                  <button
                    type="button"
                    onClick={() => {
                      setProtocol(m.protocol);
                      lookup(m.protocol);
                    }}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left hover:text-forest"
                  >
                    <span className="font-mono text-sm font-semibold">{m.protocol}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
