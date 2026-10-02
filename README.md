# Samriddhi Help Team Foundation

NGO website with an admin dashboard.

- `frontend/` contains the React and Vite public site and admin UI. It deploys as its own Railway service.
- `backend/` contains the Fastify API with PostgreSQL for content, admin login, uploads, and donation reports. It deploys as its own Railway service.

## Local development

Use Node.js 22.12 or newer, within 22.x.

```text
cd backend
npm install
npm test

cd ../frontend
npm install
npm run dev
```

To point the local frontend at a local backend, create `frontend/.env.local` with `VITE_API_URL=http://localhost:3000`. Backend variables are listed in `backend/.env.example`.

For deployment, see `RAILWAY_DEPLOYMENT.md`.
