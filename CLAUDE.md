# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Type-check with `tsc -b` then build with Vite
- `npm run lint` — Run ESLint across the project
- `npm run preview` — Preview the production build locally

No test runner is configured yet.

## Architecture

React 19 + TypeScript + Vite app using TanStack Router (file-based routing) and TanStack Query for server state.

### Routing

Routes live in `src/routes/` and are auto-discovered by the TanStack Router Vite plugin. The generated route tree is in `src/routeTree.gen.ts` (do not edit manually). Auto code-splitting is enabled, so each route is lazily loaded.

The root layout (`src/routes/__root.tsx`) provides a sidebar navigation and `<Outlet />` for child routes.

### Feature Module Pattern

Features live in `src/features/<name>/` and follow a four-layer pattern:

1. **`<Name>.api.ts`** — Pure async functions for HTTP requests. Exports the domain type and an API object.
2. **`<Name>.facade.ts`** — Custom hook wrapping TanStack Query (`useSuspenseQuery`, `useMutation`). Manages server state, caching, and optimistic updates. Returns data and action methods.
3. **`<Name>.presenter.ts`** — Custom hook for local UI state (form inputs, validation, event handlers). Receives actions from the facade via `Pick<ReturnType<typeof useFacade>, ...>`.
4. **`<Name>.component.tsx`** — Memoized React component that composes the facade and presenter hooks, renders UI only.

When adding a new feature, replicate this layered structure. Keep data-fetching logic in the facade, form/UI state in the presenter, and the component as a thin view layer.

### Styling

Tailwind CSS v4 via the `@tailwindcss/vite` plugin. Global styles are in `src/styles/global.css`.
