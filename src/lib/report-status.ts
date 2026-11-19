export type ReportStatus = "recebida" | "em_analise" | "em_atendimento" | "resolvida" | "descartada";

export const STATUS_ORDER: ReportStatus[] = [
  "recebida",
  "em_analise",
  "em_atendimento",
  "resolvida",
  "descartada",
];

export const STATUS_LABEL: Record<ReportStatus, string> = {
  recebida: "Recebida",
  em_analise: "Em análise",
  em_atendimento: "Em atendimento",
  resolvida: "Resolvida",
  descartada: "Descartada",
};

export const STATUS_HINT: Record<ReportStatus, string> = {
  recebida: "A denúncia chegou e aguarda a equipe.",
  em_analise: "A equipe está verificando as informações.",
  em_atendimento: "Há equipe acionada ou a caminho do local.",
  resolvida: "Ocorrência encerrada.",
  descartada: "Não foi confirmada ou estava duplicada.",
};

/** Denúncia é "recente" no mapa quando tem até 72 horas. */
export const RECENT_HOURS = 72;

export function isRecent(createdAt: string, now: Date = new Date()): boolean {
  return now.getTime() - new Date(createdAt).getTime() <= RECENT_HOURS * 3600 * 1000;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}
