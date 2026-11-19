const KEY = "alerta-verde:minhas-denuncias";

export interface SavedReport {
  protocol: string;
  createdAt: string;
}

export function loadMyReports(): SavedReport[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedReport[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMyReport(r: SavedReport) {
  const list = loadMyReports().filter((x) => x.protocol !== r.protocol);
  list.unshift(r);
  window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
}
