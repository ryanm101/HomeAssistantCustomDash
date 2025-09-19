# Epic: rpidash — 7" (1024×600) Home Assistant SPA

This epic tracks the end‑to‑end delivery of a touch‑first, Raspberry Pi‑friendly SPA using React, Tailwind CSS v4, and shadcn/ui.

## Milestones

1) M1 — App Shell & Routing (this sprint)
- TopBar, Sidebar, Footer layout
- React Router routes + lazy pages
- Basic OverviewPage skeleton
- Minimal unit test for shell rendering

2) M2 — HA Core (Client + Store + Hooks)
- `src/ha/client.ts` with reconnect, ping
- `src/store/entitiesStore.ts` and selectors
- Hooks: `useHAConnection`, `useEntity`, `useServiceCall`

3) M3 — Widgets & Pages
- Overview tiles (EntityTile, ClimateCard, EnergyNowCard)
- Climate, Energy, Media, Security page basics

4) M4 — Footer Status & PWA
- Wire connection, latency, last-update, alerts
- Add `vite-plugin-pwa`, manifest, icons

5) M5 — Testing & Performance
- Vitest + RTL coverage for hooks/widgets
- Memoization, route code-splitting review

6) M6 — Kiosk & Device QA
- Wake lock, fullscreen, density settings
- RPi runbook, perf tuning

## Risks

- Pi performance with complex widgets
- Tailwind v4 + shadcn/ui compatibility
- HA token handling policy on-device

