# samriddhi-help-team-foundation

React/Vite frontend plus Fastify/PostgreSQL backend, deployed as one Railway service.

## Development server

A Vite development server may already be running on `$PORT` (default 8443). Do not start a second one. The root `npm run dev` delegates to the frontend workspace.

## Project structure

- `frontend/src/main.tsx` — React entrypoint.
- `frontend/src/App.tsx` — primary application component.
- `frontend/src/index.css` — global CSS and Tailwind CSS v4 import.
- `frontend/public/` — static frontend assets, including governance documents.
- `frontend/index.html` — Vite HTML shell.
- `frontend/vite.config.ts` and `frontend/tsconfig.json` — frontend tooling.
- `frontend/package.json` — frontend dependencies and scripts.
- `backend/src/server.ts` — Fastify process entrypoint.
- `backend/src/app.ts` — API composition and built-frontend serving.
- `backend/migrations/` — ordered PostgreSQL migrations.
- `backend/package.json` — backend dependencies and scripts.
- `package.json` and `package-lock.json` — npm workspace orchestration and exact lockfile.
- `railway.json` — root Railway build/migrate/start settings.
- `.mise.toml` — Node.js toolchain version.

## Commands

Run from the repository root:

- `npm ci`
- `npm run build`
- `npm test`
- `npm run check`
- `npm run format:check`
- `npm run migrate`
- `npm start`

## Styling

The frontend uses Tailwind CSS v4 through `@tailwindcss/vite`. `frontend/src/index.css` imports Tailwind and the existing global styles. Keep CSS `@import` statements first. No Tailwind or PostCSS config file is required.

## Code quality

- Use double quotes for strings containing apostrophes, or escape apostrophes in single-quoted strings.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.
- Keep production API calls same-origin; `VITE_API_URL` is only an optional local-development override.
