# samriddhi-help-team-foundation

React/Vite frontend and Fastify/PostgreSQL backend, deployed as two separate Railway services (Root Directory `/frontend` and `/backend`).

## Development server

A Vite development server may already be running on `$PORT` (default 8443). Do not start a second one. Run frontend commands from `frontend/`.

## Project structure

- `frontend/src/main.tsx`: React entrypoint.
- `frontend/src/App.tsx`: primary application component.
- `frontend/src/index.css`: global CSS and Tailwind CSS v4 import.
- `frontend/public/`: static frontend assets, including governance documents.
- `frontend/index.html`: Vite HTML shell.
- `frontend/vite.config.ts` and `frontend/tsconfig.json`: frontend tooling.
- `frontend/Dockerfile`, `frontend/Caddyfile`, `frontend/railway.json`: frontend Railway build and static serving.
- `backend/src/server.ts`: Fastify process entrypoint.
- `backend/src/app.ts`: API composition.
- `backend/migrations/`: ordered PostgreSQL migrations.
- `backend/Dockerfile`, `backend/railway.json`: backend Railway build and runtime.
- Each folder has its own `package.json` and `package-lock.json`.

## Commands

- Frontend (`frontend/`): `npm ci`, `npm run build`, `npm test`, `npm run check`
- Backend (`backend/`): `npm ci`, `npm run build`, `npm test`, `npm run migrate`, `npm start`

## Styling

The frontend uses Tailwind CSS v4 through `@tailwindcss/vite`. `frontend/src/index.css` imports Tailwind and the existing global styles. Keep CSS `@import` statements first. No Tailwind or PostCSS config file is required.

## Code quality

- Use double quotes for strings containing apostrophes, or escape apostrophes in single-quoted strings.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.
- The frontend reaches the backend through the build-time `VITE_API_URL` variable.
