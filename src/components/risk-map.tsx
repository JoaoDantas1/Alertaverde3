import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import {
  ATTENTION_LABEL,
  ITABIRITO_CENTER,
  RISK_LABEL,
  STUDY_REGIONS,
  ZONE_LABEL,
  attentionLevel,
} from "@/lib/regions";
import { STATUS_LABEL, formatDateTime, isRecent, type ReportStatus } from "@/lib/report-status";
import { cn } from "@/lib/utils";

export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  status: ReportStatus;
  created_at: string;
  region_id: string | null;
}

interface Props {
  points: MapPoint[];
  showRegions?: boolean;
  showReports?: boolean;
  regionCounts: Record<string, number>;
  className?: string;
  focusRegionId?: string | null;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function RiskMap({
  points,
  showRegions = true,
  showReports = true,
  regionCounts,
  className,
  focusRegionId,
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const regionLayer = useRef<Leaflet.LayerGroup | null>(null);
  const reportLayer = useRef<Leaflet.LayerGroup | null>(null);
  const polygons = useRef<Record<string, Leaflet.Polygon>>({});

  // Create map once (browser only).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(el.current, { scrollWheelZoom: false, zoomControl: true }).setView(ITABIRITO_CENTER, 12);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      map.on("click", () => map.scrollWheelZoom.enable());
      regionLayer.current = L.layerGroup().addTo(map);
      reportLayer.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      draw();
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !regionLayer.current || !reportLayer.current) return;
    regionLayer.current.clearLayers();
    reportLayer.current.clearLayers();
    polygons.current = {};

    if (showRegions) {
      for (const r of STUDY_REGIONS) {
        const count = regionCounts[r.id] ?? 0;
        const level = attentionLevel(count);
        const poly = L.polygon(r.polygon, {
          className: cn("risk-area", `risk-${r.risk}`, `zone-${r.zone}`),
        });
        const history = r.demoHistory.map((h) => `${h.year}: <b>${h.fires}</b>`).join(" · ");
        poly.bindPopup(
          `<div style="min-width:220px">
            <div style="font-weight:700;font-size:0.95rem;margin-bottom:2px">${esc(r.name)}</div>
            <div>${RISK_LABEL[r.risk]} · ${ZONE_LABEL[r.zone]}</div>
            <div style="color:var(--muted-foreground)">${esc(r.vegetation)}</div>
            <p style="margin:6px 0">${esc(r.summary)}</p>
            <div style="background:var(--demo);color:var(--demo-foreground);border-radius:8px;padding:4px 8px;font-size:0.78rem">
              Histórico demonstrativo — ${history}
            </div>
            <div style="margin-top:6px;font-size:0.8rem"><b>Denúncias reais (30 dias):</b> ${count} — ${ATTENTION_LABEL[level]}</div>
          </div>`,
        );
        poly.addTo(regionLayer.current);
        polygons.current[r.id] = poly;
      }
    }

    if (showReports) {
      for (const p of points) {
        const recent = isRecent(p.created_at);
        const resolved = p.status === "resolvida";
        const icon = L.divIcon({
          className: "",
          html: `<span class="report-pin ${recent && !resolved ? "is-recent" : ""} ${resolved || !recent ? "is-old" : ""}"></span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        L.marker([p.latitude, p.longitude], { icon, keyboard: false })
          .bindPopup(
            `<div><div style="font-weight:700">Denúncia de morador</div>
            <div>${formatDateTime(p.created_at)}</div>
            <div>Status: <b>${STATUS_LABEL[p.status]}</b></div>
            <div style="color:var(--muted-foreground);font-size:0.78rem;margin-top:4px">Localização aproximada (≈100 m) para proteger quem denunciou.</div></div>`,
          )
          .addTo(reportLayer.current);
      }
    }
  }

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, showRegions, showReports, regionCounts]);

  useEffect(() => {
    if (!focusRegionId || !mapRef.current) return;
    const poly = polygons.current[focusRegionId];
    if (poly) {
      mapRef.current.fitBounds(poly.getBounds(), { padding: [30, 30] });
      poly.openPopup();
    }
  }, [focusRegionId]);

  return (
    <div
      ref={el}
      role="region"
      aria-label="Mapa interativo de risco de queimadas em Itabirito"
      className={cn("relative z-0 w-full overflow-hidden rounded-2xl border", className)}
    />
  );
}
