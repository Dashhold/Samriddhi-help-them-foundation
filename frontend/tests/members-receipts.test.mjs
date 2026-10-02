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

test("receipt amounts are written out in the Indian numbering system", async () => {
  const { amountInWords, numberToIndianWords, financialYearLabel, formatInr } =
    await loadTypeScriptModule("../src/receipts/format.ts")

  assert.equal(amountInWords(5000), "Rupees Five Thousand Only")
  assert.equal(
    amountInWords(125000),
    "Rupees One Lakh Twenty Five Thousand Only",
  )
  assert.equal(
    amountInWords(12345678.5),
    "Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight and Fifty Paise Only",
  )
  assert.equal(amountInWords(1001), "Rupees One Thousand One Only")
  assert.equal(amountInWords(0.75), "Rupees Zero and Seventy Five Paise Only")
  assert.equal(numberToIndianWords(1_000_000_000), "One Hundred Crore")
  assert.equal(financialYearLabel("2026-04-01"), "2026-27")
  assert.equal(financialYearLabel("2027-03-31"), "2026-27")
  assert.match(formatInr(5000), /5,000\.00/)
})

test("membership expiry compares calendar dates", async () => {
  const { isMembershipExpired, addOneYear } = await loadTypeScriptModule(
    "../src/members/format.ts",
  )
  const today = new Date(2026, 9, 2)

  assert.equal(isMembershipExpired("2026-10-02", today), false)
  assert.equal(isMembershipExpired("2026-10-01", today), true)
  assert.equal(isMembershipExpired("", today), false)
  assert.equal(addOneYear(new Date(2026, 9, 2)), "2027-10-02")
})
