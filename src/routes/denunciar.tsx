import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  Flame,
  ImagePlus,
  Loader2,
  LocateFixed,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/location-picker";
import { createPhotoUploads, submitReport } from "@/lib/reports.functions";
import { findRegion, isInsideItabirito, regionName } from "@/lib/regions";
import { resizeImage } from "@/lib/image-resize";
import { saveMyReport } from "@/lib/my-reports";
import { formatDateTime } from "@/lib/report-status";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/denunciar")({
  head: () => ({
    meta: [
      { title: "Denunciar incêndio — Alerta Verde Itabirito" },
      { name: "description", content: "Comunique um foco de incêndio em Itabirito–MG com localização por GPS, fotos e descrição." },
      { property: "og:title", content: "Denunciar incêndio — Alerta Verde" },
      { property: "og:description", content: "Viu fogo ou fumaça em Itabirito? Avise em menos de um minuto e acompanhe pelo protocolo." },
    ],
  }),
  component: ReportPage,
});

type Geo = { lat: number; lng: number; accuracy: number | null; source: "gps" | "manual" };
type GpsState = "idle" | "locating" | "ok" | "denied" | "error";

function nowLocalInput() {
  const d = new Date();
  d.setSeconds(0, 0);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function ReportPage() {
  const [geo, setGeo] = useState<Geo | null>(null);
  const [gps, setGps] = useState<GpsState>("idle");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [occurredAt, setOccurredAt] = useState(nowLocalInput);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ protocol: string; createdAt: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const prepareUploads = useServerFn(createPhotoUploads);
  const send = useServerFn(submitReport);

  function locate() {
    if (!("geolocation" in navigator)) {
      setGps("error");
      return;
    }
    setGps("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, source: "gps" });
        setGps("ok");
      },
      (err) => setGps(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }

  useEffect(() => {
    locate();
  }, []);

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const accepted = Array.from(files).filter((f) => /^image\/(jpeg|png|webp|heic|heif)$/.test(f.type) || f.type === "");
    const next = [...photos, ...accepted.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, 4);
    if (photos.length + accepted.length > 4) toast.info("Você pode enviar até 4 fotos.");
    setPhotos(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!geo) return setError("Informe o local do incêndio: use o GPS ou toque no mapa.");
    if (!isInsideItabirito(geo.lat, geo.lng)) return setError("O local marcado está fora da região de Itabirito–MG. Ajuste no mapa.");
    if (description.trim().length < 10) return setError("Descreva a ocorrência com pelo menos 10 caracteres.");

    setSubmitting(true);
    try {
      let photoPaths: string[] = [];
      if (photos.length) {
        const blobs = await Promise.all(photos.map((p) => resizeImage(p.file)));
        const types = blobs.map((b) => (b.type === "image/png" || b.type === "image/webp" ? b.type : "image/jpeg")) as (
          | "image/jpeg"
          | "image/png"
          | "image/webp"
        )[];
        const { uploads } = await prepareUploads({ data: { types } });
        await Promise.all(
          uploads.map(async (u, i) => {
            const { error: upErr } = await supabase.storage
              .from("report-photos")
              .uploadToSignedUrl(u.path, u.token, blobs[i]!, { contentType: types[i] });
            if (upErr) throw upErr;
          }),
        );
        photoPaths = uploads.map((u) => u.path);
      }

      const result = await send({
        data: {
          description,
          latitude: geo.lat,
          longitude: geo.lng,
          accuracy: geo.accuracy,
          locationSource: geo.source,
          referencePoint: reference,
          occurredAt: new Date(occurredAt).toISOString(),
          reporterName: name,
          reporterContact: contact,
          photoPaths,
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      saveMyReport({ protocol: result.protocol, createdAt: result.createdAt });
      setDone({ protocol: result.protocol, createdAt: result.createdAt });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setError("Não foi possível enviar agora. Verifique sua conexão e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return <Confirmation protocol={done.protocol} createdAt={done.createdAt} />;

  const region = geo ? findRegion(geo.lat, geo.lng) : undefined;

  return (
    <div className="container-page py-12">
      <div className="max-w-3xl">
        <span className="eyebrow">Sistema de denúncias</span>
        <h1 className="mt-3 text-4xl font-semibold text-forest-deep md:text-5xl">Denunciar incêndio</h1>
        <p className="mt-3 text-muted-foreground">
          Informe onde está o fogo, descreva o que viu e, se puder, envie fotos. Sua denúncia chega à equipe responsável.
        </p>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-fire/30 bg-fire-soft p-4 text-sm">
        <Phone className="mt-0.5 size-5 shrink-0 text-fire" />
        <p>
          <b>Fogo perto de casas ou pessoas em perigo?</b> Ligue agora para o Corpo de Bombeiros{" "}
          <a href="tel:193" className="font-bold text-fire underline">193</a> ou a Defesa Civil{" "}
          <a href="tel:199" className="font-bold text-fire underline">199</a>. Depois, registre aqui.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <section className="card-surface space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-sans text-lg font-bold">
                <MapPin className="size-5 text-forest" /> Local do incêndio
              </h2>
              <Button type="button" variant="outline" size="sm" onClick={locate} disabled={gps === "locating"}>
                {gps === "locating" ? <Loader2 className="animate-spin" /> : <LocateFixed />} Usar meu GPS
              </Button>
            </div>
            <GpsStatus gps={gps} geo={geo} />
            <LocationPicker
              value={geo}
              onPick={(lat, lng) => setGeo({ lat, lng, accuracy: null, source: "manual" })}
            />
            <p className="text-xs text-muted-foreground">
              Toque no mapa ou arraste o marcador para indicar o ponto exato do fogo, se estiver vendo de longe.
            </p>
            {geo && (
              <p className="text-sm">
                Região: <b>{region ? regionName(region.id) : "Fora das áreas mapeadas"}</b>
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="ref">Ponto de referência (opcional)</Label>
              <Input
                id="ref"
                maxLength={200}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex.: atrás da escola, perto da torre, km 2 da estrada…"
              />
            </div>
          </section>

          <section className="card-surface space-y-4 p-6">
            <h2 className="flex items-center gap-2 font-sans text-lg font-bold">
              <Flame className="size-5 text-fire" /> O que está acontecendo
            </h2>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Descrição da ocorrência *</Label>
              <Textarea
                id="desc"
                required
                rows={5}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: muita fumaça e chamas no morro, o fogo está avançando em direção às casas…"
              />
              <p className="text-right text-xs text-muted-foreground">{description.length}/2000</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="when" className="flex items-center gap-1.5">
                <Clock className="size-4" /> Quando você viu o fogo
              </Label>
              <Input id="when" type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
              <p className="text-xs text-muted-foreground">A data e o horário do envio também são registrados automaticamente.</p>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card-surface space-y-4 p-6">
            <h2 className="flex items-center gap-2 font-sans text-lg font-bold">
              <Camera className="size-5 text-forest" /> Fotos (opcional)
            </h2>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              {photos.map((p, i) => (
                <div key={p.url} className="relative aspect-square overflow-hidden rounded-xl border">
                  <img src={p.url} alt={`Foto ${i + 1} da ocorrência`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-foreground/70 text-background"
                    aria-label={`Remover foto ${i + 1}`}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              {photos.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-forest hover:text-forest"
                >
                  <ImagePlus className="size-7" /> Adicionar foto
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Até 4 fotos. Só tire fotos se estiver em local seguro.</p>
          </section>

          <section className="card-surface space-y-4 p-6">
            <h2 className="font-sans text-lg font-bold">Seus dados (opcional)</h2>
            <p className="text-sm text-muted-foreground">
              Ajuda a equipe a falar com você, se precisar. Esses dados não aparecem no mapa nem na consulta pública.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact">Telefone ou e-mail</Label>
              <Input id="contact" maxLength={160} value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
          </section>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
            </div>
          )}

          <Button type="submit" variant="alert" size="xl" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : <Flame />}
            {submitting ? "Enviando denúncia…" : "Enviar denúncia"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function GpsStatus({ gps, geo }: { gps: GpsState; geo: Geo | null }) {
  if (gps === "locating") return <p className="text-sm text-muted-foreground">Buscando sua localização…</p>;
  if (geo?.source === "gps")
    return (
      <p className="text-sm text-forest">
        <b>Localização obtida pelo GPS</b>
        {geo.accuracy ? ` (precisão de ~${Math.round(geo.accuracy)} m)` : ""}.
      </p>
    );
  if (geo?.source === "manual") return <p className="text-sm text-forest"><b>Local marcado no mapa.</b></p>;
  if (gps === "denied")
    return <p className="text-sm text-muted-foreground">Permissão de localização negada. Marque o local tocando no mapa.</p>;
  if (gps === "error")
    return <p className="text-sm text-muted-foreground">Não conseguimos usar o GPS. Marque o local tocando no mapa.</p>;
  return null;
}

function Confirmation({ protocol, createdAt }: { protocol: string; createdAt: string }) {
  return (
    <div className="container-page py-16">
      <div className="card-surface mx-auto max-w-xl p-8 text-center md:p-12 animate-rise">
        <CheckCircle2 className="mx-auto size-14 text-forest" />
        <h1 className="mt-5 text-3xl font-semibold text-forest-deep">Denúncia registrada</h1>
        <p className="mt-2 text-muted-foreground">Obrigado por cuidar de Itabirito. Enviada em {formatDateTime(createdAt)}.</p>
        <div className="mt-8 rounded-2xl bg-leaf-soft p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-forest">Seu protocolo</div>
          <div className="mt-1 font-mono text-2xl font-bold tracking-wider text-forest-deep">{protocol}</div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => {
              navigator.clipboard?.writeText(protocol);
              toast.success("Protocolo copiado");
            }}
          >
            <Copy /> Copiar
          </Button>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          Guarde este número. Ele também ficou salvo neste aparelho, em “Acompanhar denúncia”.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/acompanhar" search={{ protocolo: protocol }}>Acompanhar denúncia</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/mapa">Ver no mapa</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
