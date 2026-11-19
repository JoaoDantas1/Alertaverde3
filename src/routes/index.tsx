import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bird,
  Camera,
  Droplets,
  Flame,
  HeartPulse,
  LocateFixed,
  Map,
  Phone,
  SearchCheck,
  Sprout,
  Trees,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RiskMap } from "@/components/risk-map";
import { DemoBadge } from "@/components/demo-badge";
import { countByRegion, publicPointsOptions } from "@/lib/report-queries";
import { STUDY_REGIONS } from "@/lib/regions";
import landscape from "@/assets/itabirito-landscape.jpg";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publicPointsOptions),
  head: () => ({
    meta: [
      { title: "Alerta Verde — Prevenção de queimadas em Itabirito–MG" },
      {
        name: "description",
        content:
          "Denuncie focos de incêndio, consulte o mapa de risco e aprenda a prevenir queimadas em Itabirito, Minas Gerais.",
      },
      { property: "og:title", content: "Alerta Verde — Juntos pela prevenção, juntos pela vida" },
      {
        property: "og:description",
        content: "Plataforma comunitária para comunicar focos de incêndio e consultar o mapa de risco de Itabirito–MG.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data } = useSuspenseQuery(publicPointsOptions);
  const counts = countByRegion(data.points);
  const recentTotal = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-forest-deep">
        <img
          src={landscape}
          alt="Serras e campos rupestres de Minas Gerais ao amanhecer, com a cidade ao fundo"
          width={1600}
          height={768}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-hero-fade" />
        <div className="container-page flex min-h-[600px] flex-col justify-center py-20 md:min-h-[640px]">
          <div className="max-w-2xl animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-leaf backdrop-blur">
              <Sprout className="size-4" /> Itabirito · Minas Gerais
            </span>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.02] text-primary-foreground md:text-7xl">
              Juntos pela prevenção, <span className="text-leaf">juntos pela vida.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/85">
              O Alerta Verde conecta moradores e autoridades para identificar focos de incêndio rapidamente e
              proteger nossa vegetação, a fauna e as famílias de Itabirito.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="alert" size="xl">
                <Link to="/denunciar">
                  <Flame className="!size-5" /> DENUNCIAR INCÊNDIO
                </Link>
              </Button>
              <Button asChild variant="heroOutline" size="xl">
                <Link to="/mapa">
                  <Map className="!size-5" /> CONSULTAR MAPA DE RISCO
                </Link>
              </Button>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-primary-foreground/75">
              <Phone className="size-4 text-leaf" /> Perigo imediato? Ligue para os Bombeiros:{" "}
              <a href="tel:193" className="font-bold text-primary-foreground underline">193</a>
            </p>
          </div>
        </div>
      </section>

      <section className="container-page -mt-10 relative z-10">
        <div className="card-surface grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
          <Stat icon={<Map />} value={`${STUDY_REGIONS.length} regiões`} label="mapeadas para estudo de risco" />
          <Stat
            icon={<Flame />}
            value={recentTotal === 1 ? "1 denúncia" : `${recentTotal} denúncias`}
            label="reais de moradores nos últimos 30 dias"
          />
          <Stat icon={<Trees />} value="Cerrado e campos rupestres" label="vegetação que precisamos proteger" />
        </div>
      </section>

      <section className="container-page mt-24">
        <div className="max-w-2xl">
          <span className="eyebrow">Como funciona</span>
          <h2 className="mt-3 text-4xl font-semibold text-forest-deep">Viu fumaça ou fogo? Em menos de um minuto você avisa.</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {[
            { icon: LocateFixed, t: "Localização automática", d: "O GPS do celular marca o ponto. Você pode ajustar no mapa." },
            { icon: Camera, t: "Fotos da ocorrência", d: "Envie até 4 fotos para ajudar a equipe a avaliar o foco." },
            { icon: SearchCheck, t: "Protocolo na hora", d: "Você recebe um número para acompanhar o atendimento." },
            { icon: Map, t: "No mapa da cidade", d: "A denúncia aparece no mapa, com localização aproximada." },
          ].map(({ icon: Icon, t, d }, i) => (
            <article key={t} className="card-surface p-6">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-leaf-soft text-forest">
                  <Icon className="size-5" />
                </span>
                <span className="font-display text-3xl text-border">{i + 1}</span>
              </div>
              <h3 className="mt-5 font-sans text-base font-bold">{t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-page mt-24">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="eyebrow">Mapa de risco</span>
            <h2 className="mt-3 text-4xl font-semibold text-forest-deep">Conheça as áreas mais sensíveis</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              As cores indicam o risco estimado de cada região. Os pontos são denúncias reais enviadas por moradores.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DemoBadge>Regiões e risco demonstrativos</DemoBadge>
            <Button asChild variant="outline">
              <Link to="/mapa">
                Abrir mapa completo <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
        <RiskMap points={data.points} regionCounts={counts} className="mt-8 h-[420px]" />
      </section>

      <section className="container-page mt-24">
        <div className="overflow-hidden rounded-3xl bg-gradient-forest p-8 text-primary-foreground md:p-14">
          <span className="eyebrow !text-leaf">Por que preservar</span>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold">Cada queimada evitada protege a água, os animais e a nossa saúde.</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { icon: Bird, t: "Fauna e flora únicas", d: "Os campos rupestres e o cerrado da região abrigam espécies que só existem aqui. O fogo destrói abrigos e alimento." },
              { icon: Droplets, t: "Água e nascentes", d: "A vegetação protege o solo e as nascentes que abastecem a cidade. Sem ela, vêm a erosão e a seca." },
              { icon: HeartPulse, t: "Saúde e segurança", d: "A fumaça agrava doenças respiratórias, e o fogo perto de casas coloca famílias em risco." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t}>
                <Icon className="size-8 text-leaf" />
                <h3 className="mt-4 font-sans text-lg font-bold">{t}</h3>
                <p className="mt-2 text-sm text-primary-foreground/80">{d}</p>
              </div>
            ))}
          </div>
          <Button asChild variant="leaf" size="lg" className="mt-10">
            <Link to="/prevencao">
              Veja como prevenir <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-4 p-6">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-leaf-soft text-forest [&_svg]:size-5">{icon}</span>
      <div>
        <div className="font-display text-xl font-semibold text-forest-deep">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
