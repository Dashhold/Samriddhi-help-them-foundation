import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { ModuleKind, ScriptTarget, transpileModule } from "typescript"

async function loadTypeScriptModule(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8")
  const javascript = transpileModule(source, {
    compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 },
  }).outputText
  const dataUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
  return import(dataUrl)
}

test("production API routing requires and normalizes a trusted HTTPS origin", async () => {
  const { resolveApiBaseUrl } = await loadTypeScriptModule(
    "../src/lib/api-origin.ts",
  )

  assert.equal(
    resolveApiBaseUrl({
      development: false,
      production: true,
      configuredUrl: "https://API.Example.org:443/",
    }),
    "https://api.example.org",
  )
  assert.equal(
    resolveApiBaseUrl({
      development: false,
      production: true,
      configuredUrl: "backend-production.up.railway.app",
    }),
    "https://backend-production.up.railway.app",
  )

  for (const configuredUrl of [
    undefined,
    "",
    "https://user:password@api.example.org",
    "https://*.example.org",
    "https://api.example.org/base",
    "https://api.example.org/.",
    "https://api.example.org//",
    "https://api.example.org?target=other",
    "https://api.example.org#fragment",
    "ftp://api.example.org",
    "http://api.example.org",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
  ]) {
    assert.equal(
      resolveApiBaseUrl({
        development: false,
        production: true,
        configuredUrl,
      }),
      null,
      String(configuredUrl),
    )
  }
})

test("development keeps VITE_API_URL optional and limits HTTP to loopback", async () => {
  const { resolveApiBaseUrl } = await loadTypeScriptModule(
    "../src/lib/api-origin.ts",
  )

  assert.equal(
    resolveApiBaseUrl({ development: true, production: false }),
    null,
  )
  for (const [configuredUrl, expected] of [
    ["http://localhost:3000/", "http://localhost:3000"],
    ["http://127.0.0.1:3000", "http://127.0.0.1:3000"],
    ["http://[::1]:3000", "http://[::1]:3000"],
    ["https://api.example.org/", "https://api.example.org"],
  ]) {
    assert.equal(
      resolveApiBaseUrl({
        development: true,
        production: false,
        configuredUrl,
      }),
      expected,
    )
  }
  assert.equal(
    resolveApiBaseUrl({
      development: true,
      production: false,
      configuredUrl: "http://example.org",
    }),
    null,
  )
  assert.equal(
    resolveApiBaseUrl({
      development: false,
      production: false,
      configuredUrl: "https://api.example.org",
    }),
    null,
  )
})

test("API endpoint construction cannot switch away from the configured origin", async () => {
  const { apiEndpoint } = await loadTypeScriptModule("../src/lib/api-origin.ts")
  const baseUrl = "https://api.example.org"

  assert.equal(apiEndpoint(baseUrl, "/api/content"), `${baseUrl}/api/content`)
  assert.equal(apiEndpoint(baseUrl, "api/auth/login"), `${baseUrl}/api/auth/login`)
  for (const path of ["https://attacker.example/steal", "//attacker.example/steal"]) {
    const endpoint = apiEndpoint(baseUrl, path)
    assert.equal(new URL(endpoint).origin, baseUrl)
    assert.ok(endpoint.startsWith(`${baseUrl}/`))
  }
})

test("login and bearer requests use the single credential-omitting API helper", async () => {
  const apiSource = await readFile(new URL("../src/lib/api.ts", import.meta.url), "utf8")
  const sessionSource = await readFile(
    new URL("../src/auth/adminSession.ts", import.meta.url),
    "utf8",
  )

  assert.equal((apiSource.match(/\bfetch\(/g) ?? []).length, 1)
  assert.match(apiSource, /credentials: "omit"/)
  assert.match(apiSource, /headers\.set\("Authorization", `Bearer/)
  assert.match(sessionSource, /apiRequest<AdminSession>\("\/api\/auth\/login"/)
  assert.doesNotMatch(sessionSource, /\bfetch\(/)
})

test("CSV exports neutralize spreadsheet formulas after whitespace and controls", async () => {
  const { donationRecordsToCsv } = await loadTypeScriptModule(
    "../src/payments/contracts.ts",
  )
  const csv = donationRecordsToCsv([
    {
      id: "=2+2",
      providerOrderId: "order-1",
      providerPaymentId: "@SUM(1,1)",
      donorType: "individual",
      donorName: ' \t=HYPERLINK("https://example.invalid")',
      companyName: "+1+1",
      email: "\t@malicious.example",
      amount: 123.45,
      currency: "INR",
      purpose: "\u0001-2+3",
      status: "paid",
      receiptNumber: "safe-receipt",
      createdAt: "2026-02-10T10:00:00.000Z",
    },
  ])

  assert.ok(csv.includes('"\'=2+2"'))
  assert.ok(csv.includes('"\'+1+1"'))
  assert.ok(csv.includes('"\'\t@malicious.example"'))
  assert.ok(csv.includes('"\'\u0001-2+3"'))
  assert.ok(csv.includes('"\'@SUM(1,1)"'))
  assert.ok(csv.includes('"safe-receipt"'))
})

test("certificate details stay sample-only until a donation is confirmed paid", async () => {
  const { certificateDetails } = await loadTypeScriptModule(
    "../src/payments/certificate.ts",
  )

  const unpaid = certificateDetails({
    id: "donation-1",
    donorName: "Real Donor",
    status: "pending",
    paidAt: "2026-02-10T10:05:00.000Z",
  })
  assert.equal(unpaid.isPreview, true)
  assert.equal(unpaid.supporterName, "Supporter Name")
  assert.equal(unpaid.reference, "SAMPLE-PREVIEW-001")

  const paid = certificateDetails({
    id: "donation-1",
    providerOrderId: "order-1",
    providerPaymentId: "payment-1",
    donorType: "individual",
    donorName: "Confirmed Donor",
    purpose: "General donation",
    status: "paid",
    paidAt: "2026-02-10T10:05:00.000Z",
  })
  assert.equal(paid.isPreview, false)
  assert.equal(paid.supporterName, "Confirmed Donor")
  assert.equal(paid.reference, "payment-1")
})
