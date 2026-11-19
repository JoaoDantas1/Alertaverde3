import { DemoBadge } from "@/components/demo-badge";

export function MapLegend() {
  return (
    <div className="card-surface space-y-4 p-5 text-sm">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-sans text-sm font-bold">Nível de risco da região</h3>
          <DemoBadge />
        </div>
        <ul className="space-y-2">
          <li className="flex items-center gap-2.5"><span className="size-4 rounded bg-risk-high" /> Risco alto</li>
          <li className="flex items-center gap-2.5"><span className="size-4 rounded bg-risk-medium" /> Risco médio</li>
          <li className="flex items-center gap-2.5"><span className="size-4 rounded bg-risk-low" /> Risco baixo</li>
        </ul>
      </div>
      <div>
        <h3 className="mb-2 font-sans text-sm font-bold">Tipo de área</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-center gap-2.5"><span className="h-0 w-6 border-t-2 border-foreground" /> Contorno contínuo: vegetação</li>
          <li className="flex items-center gap-2.5"><span className="h-0 w-6 border-t-2 border-dashed border-foreground" /> Contorno tracejado: residencial</li>
        </ul>
      </div>
      <div>
        <h3 className="mb-2 font-sans text-sm font-bold">Denúncias de moradores (reais)</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-center gap-2.5"><span className="size-4 rounded-full border-2 border-card bg-fire shadow" /> Foco recente (até 72 h)</li>
          <li className="flex items-center gap-2.5"><span className="size-4 rounded-full border-2 border-card bg-muted-foreground shadow" /> Mais antiga ou resolvida</li>
        </ul>
      </div>
      <p className="border-t pt-3 text-xs text-muted-foreground">
        Atenção comunitária (denúncias reais em 30 dias): 1–2 baixa · 3–4 média · 5 ou mais alta.
      </p>
    </div>
  );
}
