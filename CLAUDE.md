# FinClear — project notes for Claude

Personal-finance PWA. Next.js 16 (app router) · React 19 · Tailwind v4 (CSS-first `@theme`, no tailwind.config) · Zustand persisted to `localStorage['finclear_data']` · Supabase (auth + tables `expenses`, `fixed_costs`, `savings`, `budgets`, `income`, `user_settings`, RLS by `user_id`).

## Commands
- Dev: `npm run dev` · Typecheck: `npx tsc --noEmit` · Build: `npx next build` · Lint: `npm run lint`
- Deploy: push to `origin` (GitHub) → Vercel auto-deploys to personal-finance-flax.vercel.app. No Vercel CLI locally.

## Rules
- **UI work: read `docs/DESIGN.md` first.** Mobile (iPhone 390px) is the primary target; desktop must keep working.
- Agents: `ux-reviewer` (read-only audit) and `ui-designer` (implements one page/component). Run the reviewer after the designer.
- Don't `await` Supabase calls inside `onAuthStateChange` (see `AuthProvider.tsx`).
- Backup import (`DataSync.tsx`) pushes local → cloud and re-derives debt end dates from `monthsLeft`; never re-import the April 2026 backup (it holds 94 deleted expenses and shifts dates).
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY` (in `.env.local` and Vercel).
