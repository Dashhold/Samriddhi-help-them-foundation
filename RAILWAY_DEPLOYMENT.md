# Railway deployment (two services)

The repository contains two independent apps. Each Railway service builds only its own folder using that folder's `Dockerfile`, plus one Railway PostgreSQL service.

| Service  | Root Directory | Config File Path         | What runs                                                     |
| -------- | -------------- | ------------------------ | ------------------------------------------------------------- |
| Frontend | `/frontend`    | `/frontend/railway.json` | Node 22 builds the Vite site; Caddy serves `dist` on `$PORT`. |
| Backend  | `/backend`     | `/backend/railway.json`  | Node 22 API; creates/updates database tables, then starts.    |

## Already handled in code

- The backend runs database migrations automatically on every start.
- Admin login defaults to username `jagbir-samriddhi` with the default password shared with the site owner. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` only if you want different credentials.
- CORS allows any frontend unless `FRONTEND_ORIGINS` is set.
- Asset links default to the backend's Railway domain.
- Domains can be entered with or without `https://`.

## What you need to set in Railway

1. **Backend service, Variables:** add the database connection.

   ```text
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

   If your PostgreSQL service has a different name, type `${{` and pick its `DATABASE_URL` from the list. This is the only required backend variable.

2. **Backend service, Settings → Networking:** click **Generate Domain**.
3. **Frontend service, Variables:** point the site at the backend, then redeploy the frontend.

   ```text
   VITE_API_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
   ```

   Replace `backend` with your backend service's name, or paste the backend domain directly.

4. **Both services, Settings:** set **Root Directory** and **Config File Path** as shown in the table, and clear any custom Build or Start command.

## Check after deploy

- `https://<backend-domain>/health` returns HTTP 200.
- `https://<frontend-domain>/admin` shows the admin login. Signing in with the admin credentials opens the dashboard.

If a build log shows `nodejs_18`, `caddy fmt`, or Nixpacks, the service is not using its Dockerfile. Re-check its Root Directory and Config File Path, then redeploy with the build cache cleared.
