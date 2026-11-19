<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules (Alerta Verde)

- Reports are inserted only through the `submitReport` server function (service-role, after zod validation); anonymous visitors never get direct table access. Why: protects reporters' personal data.
- Public data (map points, protocol tracking) comes from SECURITY DEFINER SQL functions that return rounded coordinates and no personal fields. Why: the map must never expose who reported or their exact location.
- Report status changes are made by inserting into `report_updates`; a trigger moves `reports.status`. Why: keeps a complete history shown to the resident.
- Team access uses `user_roles` (`admin`, `equipe`) checked by `is_team`/`has_role`; the owner e-mail is auto-granted admin on confirmed sign-up by a trigger. Why: roles must never live on user-editable data.
- Map regions, risk levels and history live in `src/lib/regions.ts` and are labeled demonstrative in the UI; only resident reports are real data. Why: the brief forbids presenting fictitious data as real.
- Leaflet is imported dynamically inside effects (never at module top level). Why: it touches `window` and breaks SSR.
