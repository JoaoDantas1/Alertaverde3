import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { findRegion, isInsideItabirito } from "./regions";
import type { ReportStatus } from "./report-status";

const BUCKET = "report-photos";
const PHOTO_PATH = /^uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/* ---------------- Público ---------------- */

export const createPhotoUploads = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ types: z.array(z.enum(["image/jpeg", "image/png", "image/webp"])).min(1).max(4) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
    const uploads: { path: string; token: string }[] = [];
    for (const type of data.types) {
      const path = `uploads/${crypto.randomUUID()}.${ext[type]}`;
      const { data: signed, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
      if (error || !signed) {
        console.error("signed upload failed", error);
        throw new Error("Não foi possível preparar o envio das fotos.");
      }
      uploads.push({ path, token: signed.token });
    }
    return { uploads };
  });

const submitSchema = z.object({
  description: z.string().trim().min(10, "Descreva a ocorrência com pelo menos 10 caracteres.").max(2000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(100000).nullable(),
  locationSource: z.enum(["gps", "manual"]),
  referencePoint: z.string().trim().max(200).optional().default(""),
  occurredAt: z.string().datetime({ offset: true }),
  reporterName: z.string().trim().max(120).optional().default(""),
  reporterContact: z.string().trim().max(160).optional().default(""),
  photoPaths: z.array(z.string().regex(PHOTO_PATH)).max(4).default([]),
});

export type SubmitReportInput = z.input<typeof submitSchema>;

export const submitReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data }) => {
    if (!isInsideItabirito(data.latitude, data.longitude)) {
      return { ok: false as const, error: "A localização informada está fora da região de Itabirito–MG." };
    }
    const occurred = new Date(data.occurredAt);
    const now = Date.now();
    if (occurred.getTime() > now + 10 * 60 * 1000 || occurred.getTime() < now - 7 * 24 * 3600 * 1000) {
      return { ok: false as const, error: "Informe um horário dos últimos 7 dias." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const region = findRegion(data.latitude, data.longitude);
    const { data: row, error } = await supabaseAdmin
      .from("reports")
      .insert({
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        location_accuracy: data.accuracy,
        location_source: data.locationSource,
        reference_point: data.referencePoint || null,
        occurred_at: occurred.toISOString(),
        reporter_name: data.reporterName || null,
        reporter_contact: data.reporterContact || null,
        photo_paths: data.photoPaths,
        region_id: region?.id ?? null,
      })
      .select("id, protocol, created_at")
      .single();

    if (error || !row) {
      console.error("insert report failed", error);
      return { ok: false as const, error: "Não foi possível registrar a denúncia. Tente novamente." };
    }

    // Aviso por e-mail para a equipe: ativado quando o domínio de envio estiver verificado.

    return { ok: true as const, protocol: row.protocol, createdAt: row.created_at };
  });

export const getPublicReportPoints = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient().rpc("public_report_points");
  if (error) {
    console.error("public points failed", error);
    return { points: [], error: "Não foi possível carregar as denúncias agora." };
  }
  return { points: data ?? [], error: null as string | null };
});

export interface TrackedReport {
  protocol: string;
  status: ReportStatus;
  created_at: string;
  occurred_at: string;
  region_id: string | null;
  photo_count: number;
  updates: { status: ReportStatus; note: string | null; created_at: string }[];
}

export const trackReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ protocol: z.string().trim().min(6).max(40) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: result, error } = await publicClient().rpc("track_report", { _protocol: data.protocol });
    if (error) {
      console.error("track failed", error);
      return { report: null, error: "Não foi possível consultar agora." };
    }
    return { report: (result as unknown as TrackedReport | null) ?? null, error: null as string | null };
  });

/* ---------------- Equipe ---------------- */

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const roles = (data ?? []).map((r) => r.role);
    return {
      email: (context.claims as { email?: string }).email ?? null,
      isAdmin: roles.includes("admin"),
      isTeam: roles.includes("admin") || roles.includes("equipe"),
    };
  });

export const listTeamReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reports")
      .select(
        "id, protocol, description, latitude, longitude, location_accuracy, location_source, reference_point, occurred_at, reporter_name, reporter_contact, photo_paths, status, region_id, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error("Não foi possível carregar as denúncias.");
    return data ?? [];
  });

export const getReportDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: report } = await context.supabase
      .from("reports")
      .select("id, photo_paths")
      .eq("id", data.id)
      .maybeSingle();
    if (!report) return { photos: [] as string[], updates: [] };
    let photos: string[] = [];
    if (report.photo_paths.length) {
      const { data: signed } = await context.supabase.storage
        .from(BUCKET)
        .createSignedUrls(report.photo_paths, 60 * 30);
      photos = (signed ?? []).map((s) => s.signedUrl).filter((u): u is string => Boolean(u));
    }
    const { data: updates } = await context.supabase
      .from("report_updates")
      .select("id, status, note, created_at")
      .eq("report_id", data.id)
      .order("created_at", { ascending: true });
    return { photos, updates: updates ?? [] };
  });

export const addReportUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        reportId: z.string().uuid(),
        status: z.enum(["recebida", "em_analise", "em_atendimento", "resolvida", "descartada"]),
        note: z.string().trim().max(1000).optional().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("report_updates").insert({
      report_id: data.reportId,
      status: data.status,
      note: data.note || null,
      created_by: context.userId,
    });
    if (error) {
      console.error("update failed", error);
      return { ok: false, error: "Você não tem permissão ou houve um erro ao salvar." };
    }
    return { ok: true, error: null };
  });

export const addTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ email: z.string().trim().email().max(255) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) return { ok: false, message: "Apenas administradores podem adicionar pessoas à equipe." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const target = data.email.toLowerCase();
    let found: { id: string } | undefined;
    for (let page = 1; page <= 10 && !found; page++) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return { ok: false, message: "Não foi possível consultar as contas." };
      found = list.users.find((u) => u.email?.toLowerCase() === target);
      if (list.users.length < 200) break;
    }
    if (!found) {
      return {
        ok: false,
        message: "Nenhuma conta com esse e-mail. Peça para a pessoa criar a conta na Área da equipe primeiro.",
      };
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: found.id, role: "equipe" }, { onConflict: "user_id,role", ignoreDuplicates: true });
    if (error) return { ok: false, message: "Não foi possível conceder o acesso." };
    return { ok: true, message: `${data.email} agora faz parte da equipe.` };
  });
