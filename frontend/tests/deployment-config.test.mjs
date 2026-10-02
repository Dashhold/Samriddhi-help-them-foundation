import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import test from "node:test"

const frontendRoot = new URL("../", import.meta.url)

async function text(path) {
  return readFile(new URL(path, frontendRoot), "utf8")
}

test("the frontend manifest and lock support isolated deterministic installs", async () => {
  const manifest = JSON.parse(await text("package.json"))
  const lock = JSON.parse(await text("package-lock.json"))

  assert.equal(manifest.engines.node, ">=22.12.0 <23")
  assert.equal(manifest.test, undefined)
  assert.equal(manifest.scripts.test, "node --test tests/*.test.mjs")
  assert.equal(lock.lockfileVersion, 3)
  assert.equal(lock.packages[""].name, manifest.name)
  assert.equal(lock.packages[""].engines.node, manifest.engines.node)
  assert.deepEqual(lock.packages[""].dependencies, manifest.dependencies)
  assert.deepEqual(lock.packages[""].devDependencies, manifest.devDependencies)
})

test("the Docker image has one pinned build install and a Caddy-only runtime", async () => {
  const dockerfile = await text("Dockerfile")
  const [buildStage, runtimeStage] = dockerfile.split("FROM caddy:2.9.1-alpine")

  assert.match(buildStage, /^FROM node:22\.14\.0-bookworm-slim AS build/m)
  assert.equal((dockerfile.match(/\bnpm ci\b/g) ?? []).length, 1)
  assert.match(buildStage, /RUN npm ci --include=dev/)
  assert.match(buildStage, /ARG VITE_API_URL/)
  assert.match(buildStage, /ENV VITE_API_URL=\$VITE_API_URL/)
  assert.match(buildStage, /RUN npm run build/)
  assert.ok(runtimeStage)
  assert.doesNotMatch(runtimeStage, /\b(?:ARG|ENV) VITE_API_URL\b/)
  assert.match(runtimeStage, /COPY --from=build \/app\/dist \/srv/)
  assert.doesNotMatch(
    runtimeStage,
    /node_modules|package(?:-lock)?\.json|src\//,
  )

  const dockerignore = await text(".dockerignore")
  assert.match(dockerignore, /^\.env\*$/m)
  assert.match(dockerignore, /^node_modules$/m)
  assert.match(dockerignore, /^dist$/m)
})

test("Caddy listens on Railway PORT with SPA fallback and explicit caching", async () => {
  const caddyfile = await text("Caddyfile")

  assert.match(caddyfile, /:\{\$PORT:8080\}/)
  assert.match(caddyfile, /encode zstd gzip/)
  assert.match(caddyfile, /try_files \{path\} \/index\.html/)
  assert.match(caddyfile, /no-store, no-cache, must-revalidate/)
  assert.match(caddyfile, /max-age=31536000, immutable/)
  assert.match(caddyfile, /@documents path \/documents\/\*/)
  assert.match(caddyfile, /@documents Cache-Control "public, max-age=3600"/)
})

test("Railway selects the local Dockerfile and root health check", async () => {
  const railway = JSON.parse(await text("railway.json"))

  assert.equal(railway.build.builder, "DOCKERFILE")
  assert.equal(railway.deploy.healthcheckPath, "/")
})

test("production builds read VITE_API_URL and requests stay fixed to it", async () => {
  const viteConfig = await text("vite.config.ts")
  const apiSource = await text("src/lib/api.ts")

  assert.match(viteConfig, /loadEnv\(mode, import\.meta\.dirname, "VITE_"\)/)
  assert.match(viteConfig, /mode === "production"/)
  assert.match(apiSource, /configuredUrl: import\.meta\.env\.VITE_API_URL/)
  assert.match(apiSource, /credentials: "omit"/)
  assert.match(apiSource, /Authorization.*Bearer/)
  assert.doesNotMatch(apiSource, /localStorage|sessionStorage|location\.search/)
  assert.doesNotMatch(apiSource, /useSameOriginApi/)
})

test("the eight governance documents retain their approved bytes", async () => {
  const expected = {
    "12ab-provisional-registration.pdf":
      "1a16d763a549efa9a6e403de87708d80e2400037b51830816db951cccedade59",
    "80g-provisional-approval.pdf":
      "13e5ab8a5853bdf2f2eb19d279f595df959f66df9e6138bfa013036e7039fe91",
    "articles-of-association.pdf":
      "375e699a8dd41dab105dde98582aa9f1c5c539c620b54e84d0ba3a136ddb78ef",
    "certificate-of-incorporation.pdf":
      "1c1024dd76858a35fc1cefcce92b6a9478d97f8f37704d607d3f00083251e3ac",
    "csr-registration-letter.pdf":
      "b5875cb8d40378851049d6b624a102c351d704e7fa77f8f25583923a486446a0",
    "pan-card.jpeg":
      "e2e2360d68b0cf55c41b5e805e4eac132c08071aead496619d69f5e8943300e3",
    "section-8-licence.pdf":
      "cf572b1d1d13cde4da15291e4c32e76e00213dbc2ea2ef2a2dd4bc2dee8c3434",
    "tan-allotment-letter.jpeg":
      "8a71c3fc0681d570d668686eb7d7b34423043c054e2acfe9e8f2323d8782887c",
  }

  for (const [name, digest] of Object.entries(expected)) {
    const contents = await readFile(
      new URL(`public/documents/${name}`, frontendRoot),
    )
    assert.equal(createHash("sha256").update(contents).digest("hex"), digest)
  }
})
