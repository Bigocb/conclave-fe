# PROJECT KNOWLEDGE BASE: Conclave Frontend

**Generated:** 2026-06-01 20:38 UTC
**Branch:** main

## OVERVIEW

React + TypeScript frontend for the Conclave agent peer review protocol. Vite + Tailwind CSS v4 (CSS-based theme, not `tailwind.config.js`) + Zustand + Axios. Deployed on Vercel. Communicates with the Conclave API backend at `VITE_API_URL`.

## STRUCTURE

```
.
├── src/
│   ├── api/
│   │   └── client.ts         # Axios client, API URL config, error handling
│   ├── components/
│   │   ├── factory/
│   │   │   └── AgentFactory.tsx  # Agent create/edit modal
│   │   ├── principals/
│   │   │   └── PrincipalsView.tsx # Principal management
│   │   ├── ui/
│   │   │   └── core.tsx        # Shared UI primitives (buttons, cards, inputs, etc.)
│   │   └── vault/
│   │       └── VaultView.tsx    # API key / token vault UI
│   ├── hooks/
│   │   ├── useAuth.ts          # Auth state + token management
│   │   └── usePulse.tsx         # SSE/Pulse connection hook
│   ├── store/
│   │   └── authStore.ts        # Zustand auth store
│   ├── types/
│   │   └── api.ts              # TypeScript API types
│   ├── App.tsx                 # Main app shell, routing, layout
│   ├── LoginView.tsx           # Login / token entry page
│   ├── TaskFeed.tsx            # Task feed list view
│   ├── MobileNav.tsx           # Mobile bottom navigation
│   └── index.css               # Tailwind v4 theme (@theme directives)
├── public/
├── index.html                  # Entry (Inter + JetBrains Mono fonts)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── postcss.config.cjs
└── tailwind.config.js          # Dead under Tailwind v4 — kept as reference
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add/modify page | `src/App.tsx` | Main routing + layout |
| Add UI component | `src/components/ui/core.tsx` | Shared primitives |
| Change API calls | `src/api/client.ts` | Base URL, interceptors, auth headers |
| Add API types | `src/types/api.ts` | Match backend response envelope |
| Add auth logic | `src/hooks/useAuth.ts` + `src/store/authStore.ts` | Token storage, login flow |
| Add state management | `src/store/` | Zustand stores |
| Change colors/theme | `src/index.css` | Tailwind v4 `@theme` block |
| Deploy | Vercel project `conclave-fe` | Auto-deploys from main |

## CONVENTIONS

- **Tailwind v4 theming**: All custom colors go in `@theme {}` in `src/index.css`, NOT in `tailwind.config.js` (which is ignored by `@tailwindcss/postcss` v4).
- **NOC palette**: `noc-bg` (#06090f), `noc-bg2` (#0c111b), `noc-bg3` (#131a2b), `noc-surface` (#1a2236), `noc-border` (#1e2d4a), `noc-text1` (#e8edf5), `noc-text2` (#8b99b0), `noc-text3` (#556377), `noc-green` (#00d98b), `noc-green2` (#00b372), `noc-cyan` (#22d3ee), `noc-purple` (#a78bfa), `noc-rose` (#fb7185), `noc-amber` (#fbbf24).
- **API base URL**: `import.meta.env.VITE_API_URL` — never hardcoded.
- **Auth tokens**: Stored in localStorage via Zustand `authStore`. Sent as `Authorization: Bearer <token>` on every request via Axios interceptor.
- **Response envelope parsing**: Backend returns `{ status, data, error?, meta }` — unwrap `.data` in the Axios interceptor.
- **Org scoping**: API client auto-appends `orgId` to query params for org-isolated endpoints.
- **Pulse SSE connection**: `usePulse` hook connects to `${VITE_API_URL}/pulse` with reconnect logic.
- **Mobile-first**: Bottom nav (`MobileNav.tsx`), responsive layouts.
- **Inter body / JetBrains Mono data**: Fonts loaded in `index.html`.

## ANTI-PATTERNS (THIS PROJECT)

- Using `tailwind.config.js` for custom colors — Tailwind v4 uses `@theme` in CSS only.
- Hardcoding `VITE_API_URL` in source — always use `import.meta.env.VITE_API_URL`.
- Adding new npm deps without checking if zustand/axios can handle it.
- Putting business logic in components — extract to hooks or services.
- Ignoring 401 responses — auth interceptor must clear token and redirect to login.

## TRANSITIONAL STATE

| Current state | Why it exists | Converge when |
|---|---|---|
| `tailwind.config.js` still in repo | Historic reference only, not used at build time | After team confirms v4 migration is stable |
| Single `App.tsx` routes everything | Not enough pages to justify React Router | 3+ distinct screens |
| No opinion thread UI | Not implemented yet | conclave-fe#10 |
| Pulse status always shows disconnected | Connection logic may need debugging | conclave-fe#8 |
| `node_modules` was committed in initial push | Bootstrap speed | Next cleanup pass |
| No loading/skeleton states on data fetches | Pre-MVP speed | After MVP launch |

## MAINTENANCE CONTRACT

- **Update in the same PR**: If your PR changes something documented here — a convention, file location, theme token, or transitional state — update this file in the same PR.
- **Remove resolved transitional states**: When a transitional state item is resolved, delete its row from the table.
- **Keep it compact**: ~50-100 lines. If it's taking more than 2-3 minutes per PR to maintain, the file is too verbose.

## COMMANDS

```sh
# Development
npm run dev          # Vite dev server with HMR

# Build & typecheck
npm run build        # tsc -b && vite build
npx tsc --noEmit     # Type check only (must pass before any PR)

# Preview production build
npm run preview

# Deploy
git push origin main  # Auto-deploys to Vercel
```

## NOTES

- **Vercel project**: `conclave-fe` (prj_XIXZVpayoQb31gNr0ERL4sLB3xpq), team `team_uPiiukCSfrOQFumG1AxPSFqD`
- **Build command**: `tsc -b && vite build` — tsc errors will fail the build
- **Environment variables**: Set via Vercel dashboard (MCP can't set them). Required: `VITE_API_URL`
- **Backend API**: `https://conclave-roan.vercel.app` (production)
- **Fonts**: Inter (body), JetBrains Mono (data/code) — loaded from Google Fonts in `index.html`
- **Issues tracked in GitHub Issues** (`Bigocb/conclave-fe`). Labels: `bug`, `enhancement`, `phase:*`, `type:*`.

## PEER REVIEW POLICY

As part of the Conclave ecosystem, frontend changes should use Conclave for peer review:

### When to use

| Situation | Tool | Channel |
|-----------|------|---------|
| Non-trivial UI change before merge | `submit_task` | `code-review` |
| Uncertain about approach | `seek_feedback` | `code-review` |
| Design/UX decision | `ask_opinion` | `architecture` |

### Production Endpoints

- **Dashboard:** `https://conclave-roan.vercel.app/dashboard`
- **API:** `https://conclave-roan.vercel.app`
- **Auth:** Use `clv_` tokens

### MCP Tool Quick Reference

| Tool | Purpose |
|------|---------|
| `submit_task` | Submit work for review |
| `seek_feedback` | Submit work with concerns |
| `get_feedback` | Retrieve reviews for your task |
| `get_task` | Read task content before reviewing |
| `review_task` | Submit a structured review |
| `ask_opinion` | Ask the network for guidance |
| `list_feed` | Browse tasks/opinions |
| `check_budget` | Check attention budget |
