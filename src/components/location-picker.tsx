import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import { ITABIRITO_CENTER } from "@/lib/regions";

interface Props {
  value: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}

/** Mapa pequeno para conferir ou ajustar o local da denúncia. */
export function LocationPicker({ value, onPick }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markerRef = useRef<Leaflet.Marker | null>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(el.current, { scrollWheelZoom: false }).setView(
        value ? [value.lat, value.lng] : ITABIRITO_CENTER,
        value ? 15 : 12,
      );
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      map.on("click", (e: Leaflet.LeafletMouseEvent) => onPickRef.current(e.latlng.lat, e.latlng.lng));
      mapRef.current = map;
      placeMarker();
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function placeMarker() {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !value) return;
    const icon = L.divIcon({ className: "", html: '<span class="pick-pin" style="display:block"></span>', iconSize: [26, 26], iconAnchor: [13, 26] });
    if (!markerRef.current) {
      markerRef.current = L.marker([value.lat, value.lng], { icon, draggable: true }).addTo(map);
      markerRef.current.on("dragend", () => {
        const p = markerRef.current!.getLatLng();
        onPickRef.current(p.lat, p.lng);
      });
    } else {
      markerRef.current.setLatLng([value.lat, value.lng]);
    }
    if (map.getZoom() < 14) map.setView([value.lat, value.lng], 15);
  }

  useEffect(() => {
    placeMarker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  return (
    <div
      ref={el}
      role="region"
      aria-label="Mapa para marcar o local do incêndio"
      className="relative z-0 h-64 w-full overflow-hidden rounded-xl border"
    />
  );
}
