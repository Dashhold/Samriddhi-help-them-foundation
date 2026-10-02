import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const root = process.cwd();
const npmCli = path.join(
  path.dirname(process.execPath),
  "node_modules",
  "npm",
  "bin",
  "npm-cli.js",
);

assert.ok(existsSync(npmCli), `npm CLI not found at ${npmCli}`);

function runNpm(args) {
  const display = `npm ${args.join(" ")}`;
  console.log(`\n>>> ${display}`);
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CI: "true" },
    maxBuffer: 100 * 1024 * 1024,
    detached: true,
    windowsHide: true,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  console.log(`<<< ${display}: exit ${result.status}`);

  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${display} failed`);
}

function parseCurrentToml(source) {
  const parsed = {};
  let section;

  for (const originalLine of source.split(/\r?\n/)) {
    const line = originalLine.trim();
    if (!line || line.startsWith("#")) continue;

    const sectionMatch = line.match(/^\[([A-Za-z0-9_.-]+)\]$/);
    if (sectionMatch) {
      section = sectionMatch[1].split(".").reduce((value, key) => {
        value[key] ??= {};
        return value[key];
      }, parsed);
      continue;
    }

    assert.ok(section, `TOML assignment outside a section: ${line}`);
    const assignmentMatch = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(.+)$/);
    assert.ok(assignmentMatch, `Invalid TOML assignment: ${line}`);
    section[assignmentMatch[1]] = JSON.parse(assignmentMatch[2]);
  }

  return parsed;
}

console.log(`Node ${process.version}`);
runNpm(["--version"]);
runNpm(["ci", "--include=dev"]);

const frontendRequire = createRequire(
  path.join(root, "frontend", "package.json"),
);
const backendRequire = createRequire(path.join(root, "backend", "package.json"));
for (const [label, resolvedPath] of [
  ["frontend Vite", frontendRequire.resolve("vite")],
  ["frontend TypeScript", frontendRequire.resolve("typescript")],
  ["backend TypeScript", backendRequire.resolve("typescript")],
]) {
  console.log(`${label}: ${resolvedPath}`);
}

runNpm(["run", "build"]);
runNpm(["test"]);
runNpm(["run", "check"]);
runNpm(["run", "format:check"]);

console.log("\n>>> static deployment configuration checks");
const railway = JSON.parse(readFileSync(path.join(root, "railway.json"), "utf8"));
const nixpacks = parseCurrentToml(
  readFileSync(path.join(root, "nixpacks.toml"), "utf8"),
);
const rootPackage = JSON.parse(
  readFileSync(path.join(root, "package.json"), "utf8"),
);
const mise = readFileSync(path.join(root, ".mise.toml"), "utf8");

assert.equal(railway.build.builder, "NIXPACKS");
assert.equal(railway.build.buildCommand, undefined);
assert.deepEqual(nixpacks.phases.install.dependsOn, ["setup"]);
assert.deepEqual(nixpacks.phases.install.cmds, ["npm ci --include=dev"]);
assert.deepEqual(nixpacks.phases.build.dependsOn, ["install"]);
assert.deepEqual(nixpacks.phases.build.cmds, ["npm run build"]);
assert.equal(railway.deploy.preDeployCommand, "npm run migrate");
assert.equal(railway.deploy.startCommand, "npm start");
assert.equal(railway.deploy.healthcheckPath, "/health");
assert.equal(railway.deploy.healthcheckTimeout, 30);
assert.equal(rootPackage.engines.node, "22.x");
assert.deepEqual(rootPackage.workspaces, ["frontend", "backend"]);
assert.match(mise, /^node\s*=\s*"22"$/m);

const configuredCommands = [
  ...nixpacks.phases.install.cmds,
  ...nixpacks.phases.build.cmds,
  ...(railway.build.buildCommand ? [railway.build.buildCommand] : []),
];
const installCommands = configuredCommands.filter((command) =>
  /(?:^|&&\s*)npm\s+(?:ci|i|install)(?:\s|$)/.test(command),
);
assert.deepEqual(installCommands, ["npm ci --include=dev"]);
assert.ok(
  nixpacks.phases.build.cmds.every((command) => !/\bnpm\s+ci\b/.test(command)),
);

console.log("phase sequence: setup -> install -> build");
console.log("install commands (all deployment config): 1");
console.log("install: npm ci --include=dev");
console.log("build: npm run build (contains no npm ci)");
console.log("deploy: npm run migrate -> npm start; health check /health");
console.log("Node target: 22 (.mise.toml and package engines)");
console.log("<<< static deployment configuration checks: pass");
