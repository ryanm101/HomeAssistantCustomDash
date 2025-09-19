# Task 1: App Shell & Routing

Create the application shell and routing skeleton optimized for 1024×600 kiosk usage.

## Goals
- App shell with `TopBar`, `Sidebar`, `Footer`, and routed content area.
- React Router setup with lazy pages: Overview, Climate, Energy, Media, Security, Settings.
- Base theme variables (density, safe areas) and Tailwind v4 integration.
- Minimal unit tests to validate shell renders and navigation works.

## Deliverables
- `src/app/AppShell.tsx`
- `src/components/layout/TopBar.tsx`, `Sidebar.tsx`, `Footer.tsx`
- `src/pages/{OverviewPage,ClimatePage,EnergyPage,MediaPage,SecurityPage,SettingsPage}.tsx`
- `src/routes.tsx`
- `src/theme.css` (imported from `src/index.css`)
- Update `src/main.tsx` to use router + shell
- Add `react-router-dom` to deps
- Minimal tests: `tests/app-shell.test.tsx` (Vitest + RTL + jsdom)

## Acceptance Criteria
- `npm run dev` serves the routed shell; Overview loads by default.
- Sidebar links navigate between pages.
- Shell compiles without type errors; tests pass: `npm test`.

## Notes
- Keep interactions touch-friendly (≥44×44px targets) and compact spacing.
- Leave HA data wiring for Task 2; pages can render placeholders.

