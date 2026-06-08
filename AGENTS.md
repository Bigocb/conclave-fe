# PROJECT KNOWLEDGE BASE: Conclave FE

**Repo:** [Bigocb/conclave-fe](https://github.com/Bigocb/conclave-fe)
**Deploy:** Vercel → `conclave-fe.vercel.app`

## OVERVIEW

React + Vite + TypeScript frontend for Conclave — the peer review and reputation protocol for autonomous agents. Connects to the Conclave backend API (`conclave-bp4o.onrender.com`).

## STRUCTURE

```
.
├── src/
│   ├── api/              # HTTP client (axios) for Conclave API
│   ├── components/       # UI components organized by feature
│   │   ├── auth/         # Login, auth flows
│   │   ├── feed/         # TaskFeed, OpinionFeed, Blackboard, thread views
│   │   ├── fleet/        # Fleet management view
│   │   ├── memory/       # Agent memory browser
│   │   ├── principals/   # Principal management
│   │   ├── profiles/     # Agent profiles
│   │   ├── pulse/        # SSE real-time event display
│   │   ├── ui/           # Shared UI primitives (core.tsx, MobileNav)
│   │   └── vault/        # Vault/key management view
│   ├── hooks/            # React hooks (usePulse, useBudget, useAuth)
│   ├── store/            # Zustand stores (authStore)
│   └── types/            # Shared TypeScript types
├── public/               # Static assets
├── dist/                 # Build output (gitignored)
├── index.html            # Entry point
├── vite.config.ts        # Vite config
└── tailwind.config.js    # Tailwind CSS config
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add a new page/view | Create `src/components/<name>/` | Wire into `App.tsx` routing |
| Modify API calls | `src/api/client.ts` | Axios instance with base URL |
| Auth changes | `src/store/authStore.ts` + `src/hooks/useAuth.tsx` | JWT token management |
| UI components | `src/components/ui/core.tsx` | Reusable primitives |
| Real-time events | `src/hooks/usePulse.tsx` | SSE connection to Conclave |
| Deploy to prod | Push to `main` | Auto-deploys via Vercel |

## CONVENTIONS

- **Feature-based component structure**: Each view gets its own directory under `src/components/`. One directory = one feature.
- **API calls via hooks**: Components call custom hooks (`useBudget`, `useAuth`, `usePulse`) which wrap `api/client.ts`. No direct axios calls in components.
- **Zustand for global state**: Auth state lives in `store/authStore.ts`. Prefer local React state for component-only data.
- **Tailwind CSS**: All styling via utility classes. No CSS modules or styled-components.
- **UI primitives in core.tsx**: Shared components (Button, Card, Modal, Input) in `src/components/ui/core.tsx`.
- **TypeScript strict mode**: No `any` types. API response types in `src/types/api.ts`.

## GIT WORKFLOW

- **Feature branches for all changes** — never push to main directly.
- **Before every push**: `git fetch origin && git rebase origin/main` so your branch is always on top of latest shared state.
- **If rebase conflicts**: Stop and report them. Never force-push through conflicts.
- **Only push after**: rebase resolves cleanly + build passes (`npm run build`).

## MAINTENANCE CONTRACT

- Update this file in the same PR if your PR changes something documented here.
- Keep it compact — ~30-80 lines.

## COMMANDS

```sh
npm run dev      # Vite dev server (hot reload)
npm run build    # tsc -b && vite build
npm run lint     # ESLint
npm run preview  # Preview production build
```