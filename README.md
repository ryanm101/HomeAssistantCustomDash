# rpidash

Touch-first Home Assistant dashboard tuned for Raspberry Pi kiosks (1024×600). The app ships a responsive shell, HA websocket client, memoized entity store, and a set of widgets optimised for Raspberry Pi performance.

## Features

- ⚡️ Lazy-loaded routes with an app shell (top bar, sidebar, footer) built for touch targets ≥ 44 px.
- 🧠 Resilient HA client with exponential backoff, latency pings, optimistic service calls, and normalized entity store.
- 📊 Overview dashboard widgets (climate, energy, media, security, sensors) with optimistic interactions.
- 📶 Footer status displaying connection, latency, last update, and live alerts; offline banner with Wake Lock helpers.
- 📱 PWA-ready build (`vite-plugin-pwa`), offline shell caching, and configurable theme/density persistence.
- 🧪 Vitest + Testing Library coverage including client retry logic, selector render counts, widget interactions, and axe accessibility checks.
- 🧾 Raspberry Pi kiosk runbook for Chromium autostart, wake lock, and systemd services.

## Getting Started

```bash
npm install
npm run build:css   # compile Tailwind to src/tw.css
npm run dev         # Vite dev server
```

The Tailwind CLI must run whenever you change `src/index.css` or theme tokens. In production builds it runs automatically.

## Environment Configuration

1. Start the dev server or build & serve the PWA (`npm run build && npm run preview`).
2. Open the **Settings** page and provide:
   - **Base URL** – e.g. `https://homeassistant.local:8123`
   - **Long-lived token** – generated in Home Assistant profile settings.
3. Adjust **Theme**, **Density**, fullscreen, and wake-lock controls as needed.

Credentials and kiosk preferences persist in `localStorage`; theme adapts to system preferences when set to **System**.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server with hot reload. |
| `npm run build:css` | Compile Tailwind (required before `npm run build`). |
| `npm run build` | Build CSS then emit production bundle with PWA manifest/service worker. |
| `npm run preview` | Preview production build locally. |
| `npm test` | Run Vitest suites (jsdom). |
| `npm run lint` | ESLint analysis. |

## Testing

Vitest is configured with Testing Library (`jsdom`). Widget tests use mocked service calls to validate optimistic updates. The `entitiesStore` suite ensures selector-only re-renders, and `accessibility.test.tsx` runs `axe` against the app shell.

Run all tests:

```bash
npm run build:css
npm test
```

## Deployment

See [`docs/RPI_RUNBOOK.md`](docs/RPI_RUNBOOK.md) for a detailed Raspberry Pi kiosk guide covering system packages, Chromium kiosk flags, and systemd services.

## License

MIT
