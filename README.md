# Lahan

A task management web application built with modern React and TypeScript.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for bundling and dev server
- **TanStack Router** — file-based routing with auto code-splitting
- **TanStack Query** — server state management and caching
- **Tailwind CSS v4** — utility-first styling

## Getting Started

```bash
npm install
npm run dev
```

### Available Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start dev server with HMR           |
| `npm run build`   | Type-check and build for production  |
| `npm run lint`    | Run ESLint                           |
| `npm run preview` | Preview the production build locally |

## Project Structure

```
src/
├── routes/          # File-based routes (auto-discovered by TanStack Router)
├── features/        # Feature modules
│   └── <name>/
│       ├── <Name>.api.ts          # HTTP request functions and domain types
│       ├── <Name>.facade.ts       # TanStack Query hooks (data fetching, mutations)
│       ├── <Name>.presenter.ts    # Local UI state, form logic, event handlers
│       └── <Name>.component.tsx   # Memoized React component (view layer)
├── styles/          # Global styles (Tailwind CSS)
└── routeTree.gen.ts # Auto-generated route tree (do not edit)
```

Each feature follows a four-layer architecture: **API → Facade → Presenter → Component**, keeping data-fetching, UI state, and rendering concerns cleanly separated.
