# Samriddhi Help Team Foundation

A single-service Railway application with a React/Vite frontend, Fastify API, and Railway PostgreSQL.

## Layout

- `frontend/` — public site and administrator UI; Vite builds to `frontend/dist`.
- `backend/` — Fastify API, PostgreSQL migrations, authentication, CMS, assets, and donor reporting.
- `nixpacks.toml` — deterministic Railway install and build phases.
- `railway.json` — Railway builder, migration, start, and health configuration.

## Local commands

Use Node.js 22 from the repository root:

```text
npm ci
npm run build
npm test
npm run format:check
npm run migrate
npm start
```

`npm start` serves the API and the built frontend from one Fastify process. For local frontend hot reload, run the existing Vite command from `frontend/` and set `VITE_API_URL` only when the API is on another origin. Do not start another Vite server when the Figma Make preview is already running.

See `RAILWAY_DEPLOYMENT.md` for production variables and verification.
