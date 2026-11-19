/**
 * Áreas de estudo do mapa de risco de Itabirito–MG.
 * Os limites, níveis de risco e históricos aqui são DEMONSTRATIVOS: servem para
 * ilustrar o funcionamento do mapa até que dados oficiais sejam incorporados.
 */
export type RiskLevel = "alto" | "medio" | "baixo";
export type ZoneType = "vegetacao" | "residencial" | "misto";

export interface StudyRegion {
  id: string;
  name: string;
  risk: RiskLevel;
  zone: ZoneType;
  vegetation: string;
  summary: string;
  /** Ocorrências por ano — números demonstrativos, não oficiais. */
  demoHistory: { year: number; fires: number }[];
  /** [lat, lng] */
  polygon: [number, number][];
}

export const ITABIRITO_CENTER: [number, number] = [-20.2533, -43.8013];

/** Área aproximada aceita para denúncias (entorno do município). */
export const ITABIRITO_BOUNDS = {
  minLat: -20.45,
  maxLat: -20.05,
  minLng: -44.05,
  maxLng: -43.55,
};

export const STUDY_REGIONS: StudyRegion[] = [
  {
    id: "serra-noroeste",
    name: "Serra a noroeste (Pico do Itabirito)",
    risk: "alto",
    zone: "vegetacao",
    vegetation: "Campo rupestre e cerrado de altitude",
    summary: "Vegetação seca e ventos fortes no inverno favorecem a propagação rápida do fogo.",
    demoHistory: [
      { year: 2022, fires: 7 },
      { year: 2023, fires: 9 },
      { year: 2024, fires: 12 },
    ],
    polygon: [
      [-20.205, -43.85],
      [-20.2, -43.815],
      [-20.24, -43.815],
      [-20.255, -43.82],
      [-20.245, -43.855],
    ],
  },
  {
    id: "campos-oeste",
    name: "Campos e pastagens a oeste",
    risk: "alto",
    zone: "vegetacao",
    vegetation: "Pastagens, capim seco e fragmentos de cerrado",
    summary: "Áreas abertas onde queimas de limpeza podem sair do controle.",
    demoHistory: [
      { year: 2022, fires: 5 },
      { year: 2023, fires: 8 },
      { year: 2024, fires: 10 },
    ],
    polygon: [
      [-20.255, -43.82],
      [-20.245, -43.855],
      [-20.29, -43.865],
      [-20.3, -43.83],
    ],
  },
  {
    id: "vale-sul",
    name: "Vale do Rio Itabirito (sul)",
    risk: "medio",
    zone: "misto",
    vegetation: "Mata ciliar e áreas de chácaras",
    summary: "Proximidade de nascentes e chácaras exige atenção com fogueiras e queima de lixo.",
    demoHistory: [
      { year: 2022, fires: 3 },
      { year: 2023, fires: 4 },
      { year: 2024, fires: 5 },
    ],
    polygon: [
      [-20.262, -43.786],
      [-20.268, -43.808],
      [-20.255, -43.82],
      [-20.3, -43.83],
      [-20.305, -43.79],
    ],
  },
  {
    id: "interface-leste",
    name: "Expansão urbana a leste",
    risk: "medio",
    zone: "misto",
    vegetation: "Lotes vagos e bordas de mata",
    summary: "Interface entre casas e vegetação: o fogo em terrenos baldios pode atingir residências.",
    demoHistory: [
      { year: 2022, fires: 2 },
      { year: 2023, fires: 4 },
      { year: 2024, fires: 4 },
    ],
    polygon: [
      [-20.24, -43.79],
      [-20.228, -43.76],
      [-20.272, -43.755],
      [-20.262, -43.786],
    ],
  },
  {
    id: "centro",
    name: "Centro e bairros centrais",
    risk: "baixo",
    zone: "residencial",
    vegetation: "Área urbana consolidada, praças e quintais",
    summary: "Menor cobertura vegetal; o principal risco é a queima de lixo e entulho.",
    demoHistory: [
      { year: 2022, fires: 1 },
      { year: 2023, fires: 2 },
      { year: 2024, fires: 1 },
    ],
    polygon: [
      [-20.24, -43.815],
      [-20.24, -43.79],
      [-20.262, -43.786],
      [-20.268, -43.808],
      [-20.255, -43.82],
    ],
  },
];

export const RISK_LABEL: Record<RiskLevel, string> = {
  alto: "Risco alto",
  medio: "Risco médio",
  baixo: "Risco baixo",
};

export const ZONE_LABEL: Record<ZoneType, string> = {
  vegetacao: "Área de vegetação",
  residencial: "Área residencial",
  misto: "Vegetação e residências",
};

/** Ray-casting point-in-polygon. */
export function pointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i]!;
    const [yj, xj] = polygon[j]!;
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function findRegion(lat: number, lng: number): StudyRegion | undefined {
  return STUDY_REGIONS.find((r) => pointInPolygon(lat, lng, r.polygon));
}

export function regionName(id: string | null | undefined): string {
  if (!id) return "Fora das áreas mapeadas";
  return STUDY_REGIONS.find((r) => r.id === id)?.name ?? "Fora das áreas mapeadas";
}

export function isInsideItabirito(lat: number, lng: number): boolean {
  const b = ITABIRITO_BOUNDS;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

/**
 * Nível de atenção comunitária de uma região, a partir de denúncias reais
 * dos últimos 30 dias: 1–2 baixa, 3–4 média, 5 ou mais alta.
 */
export type AttentionLevel = "nenhuma" | "baixa" | "media" | "alta";

export const ATTENTION_WINDOW_DAYS = 30;

export function attentionLevel(reportCount: number): AttentionLevel {
  if (reportCount <= 0) return "nenhuma";
  if (reportCount <= 2) return "baixa";
  if (reportCount <= 4) return "media";
  return "alta";
}

export const ATTENTION_LABEL: Record<AttentionLevel, string> = {
  nenhuma: "Sem denúncias recentes",
  baixa: "Atenção baixa",
  media: "Atenção média",
  alta: "Atenção alta",
};
