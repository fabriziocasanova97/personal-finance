# FinClear Design System

Single source of truth for UI work. Read this before touching anything in `src/app/**/page.tsx` or `src/components/**`.

## 1. Character
Editorial, calm, precise. Serif headings (Lora), sans body (Inter), mono for numbers/labels (IBM Plex Mono). **Sharp 2px corners are intentional** (`--radius-sm..3xl: 2px`) — do not round cards or buttons. The only true circles are `rounded-full` elements (FAB, icon badges, progress bars, spinner), which use `--radius-full: 9999px`.

## 2. Tokens (`src/app/globals.css` `@theme`)
| Token | Value | Use |
|---|---|---|
| `accent` | `#2a6b4f` | primary actions, active nav, brand |
| `accent-hover` | `#21543e` | hover/pressed |
| `background` / `foreground` | `#fff` / `#171717` | page |
| gray-50…900 | Tailwind default | borders `gray-200`, muted text `gray-500`, surfaces `gray-50` |
| red/green/amber-50…600 | Tailwind default | error / success / warning only |

Spacing: Tailwind scale. Page gutter `px-4 sm:px-6 lg:px-12 xl:px-24`. Section gap `space-y-6` mobile, `space-y-8` desktop.

## 3. Type
- Page title: `text-2xl sm:text-3xl font-heading font-bold`
- Section title: `text-lg font-heading font-semibold`
- Labels/eyebrows: `text-xs font-mono uppercase tracking-wider text-gray-500`
- Money: `font-mono tabular-nums`
- **Every `<input>`, `<select>`, `<textarea>` is ≥16px (`text-base`)** — iOS Safari zooms on anything smaller and never zooms back.

## 4. Mobile rules (iPhone 390×844 is the primary target)
1. **Tap targets ≥44×44px.** Buttons `h-11`, chips `min-h-11`, icon buttons `h-11 w-11`, list rows `min-h-14`.
2. **No hover-only information.** Anything shown on `group-hover` must also be visible by default on touch.
3. **Press feedback:** tappable things get `active:` styles (`active:bg-gray-100`, `active:scale-[0.98]`). Clickable rows are `<button>`, never `<div onClick>`.
4. **Safe areas:** fixed bottom UI uses `pb-safe`; fixed top UI uses `pt-safe` (utilities in globals.css). `viewport-fit=cover` is set in `layout.tsx`.
5. **Heights:** use `dvh` (`min-h-dvh`, `max-h-[90dvh]`), never `vh`.
6. **No horizontal overflow of the page.** Wide content scrolls inside its own `overflow-x-auto overscroll-x-contain` box. `grid-cols-N` with N>4 needs a mobile variant.
7. **Modals are bottom sheets on mobile** (`Modal.tsx`): slide up, `max-h-[90dvh]`, scrollable body, `pb-safe`; centered dialog from `sm:` up.
8. **Navigation:** bottom tab bar (`BottomTabBar.tsx`) on `<md`, top nav on `md+`. Content gets `pb-24 md:pb-8` to clear it. FAB sits above the tab bar; toasts render top-center on mobile.
9. **Lists on mobile are 2-line rows**, not tables: primary text + secondary meta on the left, amount right-aligned in mono.
10. Respect `prefers-reduced-motion`.

## 5. Component inventory (`src/components/ui/`)
`Button` (variants default/destructive/outline/secondary/ghost/link; sizes default/sm/lg/icon) · `Input` · `Label` · `Card` · `FilterChip` · `Modal` · `ListRow` (tappable row). Compose these; don't hand-roll buttons/inputs in pages (login page is the one legacy exception being cleaned up).

## 6. Checklist before shipping a screen
- [ ] `document.documentElement.scrollWidth <= window.innerWidth` at 390px
- [ ] all inputs 16px; all targets ≥44px
- [ ] nothing hidden behind tab bar / FAB / iOS home indicator
- [ ] desktop (1280px) unchanged or improved
- [ ] `npx tsc --noEmit` clean
