# Railway deployment (two services)

The repository contains two independent apps. Each Railway service builds only its own folder using that folder's `Dockerfile`, plus one Railway PostgreSQL service.

| Service  | Root Directory | Config File Path         | What runs                                                     |
| -------- | -------------- | ------------------------ | ------------------------------------------------------------- |
| Frontend | `/frontend`    | `/frontend/railway.json` | Node 22 builds the Vite site; Caddy serves `dist` on `$PORT`. |
| Backend  | `/backend`     | `/backend/railway.json`  | Node 22 API; runs database migrations, then starts Fastify.   |

## Setup

1. In each service, open **Settings**:
   - Set **Root Directory** as shown above.
   - Set **Config File Path** as shown above. Railway does not look inside the root directory for this file. If the field still points at `/railway.json`, change it, because that file no longer exists.
   - Clear any custom **Build Command** and **Start Command**.
   - **Builder** should show **Dockerfile**.
2. Under **Settings → Networking**, generate a public domain for both services.
3. Backend variables:

   ```text
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ADMIN_USERNAME=<admin username>
   ADMIN_PASSWORD=<admin password, at least 12 characters>
   FRONTEND_ORIGINS=https://<frontend-domain>
   ```

   - `FRONTEND_ORIGINS` is optional. When it is empty, any site can call the API.
   - `PUBLIC_API_URL` is optional and defaults to the backend's Railway domain.
   - Keep `DATABASE_SSL` unset when using the private `DATABASE_URL`. Set it to `require` only for a public database URL that needs TLS.
   - Railway provides `PORT` automatically.

4. Frontend variable:

   ```text
   VITE_API_URL=https://<backend-domain>
   ```

   This value is compiled into the site at build time. After you change it, redeploy the frontend.

5. Deploy the backend first, then the frontend.

## Check after deploy

- `https://<backend-domain>/health` returns HTTP 200.
- `https://<frontend-domain>/` loads the site.
- `https://<frontend-domain>/admin` shows the admin login. Signing in with `ADMIN_USERNAME` and `ADMIN_PASSWORD` opens the dashboard.

If the frontend build log shows `nodejs_18`, `caddy fmt`, or Nixpacks, the service is not using the Dockerfile. Re-check its Root Directory, Config File Path, and Builder settings, then redeploy with the build cache cleared.
