import { globSync } from "glob";
import { execSync } from "child_process";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join, relative, resolve } from "path";

// Typecheck small consumer projects against the built package under each
// module resolution mode consumers use. Declarations that a mode can't
// resolve turn the SDK's types into `any` without an error (skipLibCheck
// hides it), so the fixtures assert real types with @ts-expect-error.
const fixtures = resolve("test/consumer-types");

if (!existsSync(resolve("dist/esm/rpc/index.d.ts")) || !existsSync(resolve("dist/cjs/rpc/index.d.cts"))) {
  console.error("No build found in dist/. Run `pnpm build` first.");
  process.exit(1);
}

// Resolve `helius-sdk` to this checkout, through its package.json `exports`.
// Recreated every run so it can never point at a stale or installed copy.
const modules = resolve(fixtures, "node_modules");
const link = resolve(modules, "helius-sdk");
mkdirSync(modules, { recursive: true });
let existing;
try {
  existing = lstatSync(link);
} catch {
  // Nothing there yet
}
if (existing && !existing.isSymbolicLink()) {
  console.error(`${relative(process.cwd(), link)} is not a link to this checkout. Remove it and rerun.`);
  process.exit(1);
}
if (existing) unlinkSync(link);
// A junction needs no elevation on Windows; elsewhere it's a plain symlink
symlinkSync(process.cwd(), link, "junction");

const configs = globSync("*/tsconfig.*.json", { cwd: fixtures, absolute: true }).sort();

configs.forEach(config => {
  const relativePath = relative(process.cwd(), config);
  console.log(`Typechecking consumer ${relativePath}...`);
  try {
    execSync(`tsc -p "${config}"`, { stdio: "inherit" });
    console.log(`Success: ${relativePath}\n`);
  } catch (error) {
    console.error(`Failure in ${relativePath}`);
    process.exit(1);
  }
});

// Check the packed tarball with are-the-types-wrong: each entry point must
// resolve to types of the same module format as its JavaScript. The node16
// profile skips node10, which predates `exports`. attw doesn't expand
// wildcard exports, so each one is checked through one module it matches.
const { exports } = JSON.parse(readFileSync("package.json", "utf8"));
const wildcardSamples = Object.keys(exports)
  .filter(key => key.includes("*"))
  .map(key => {
    const pattern = exports[key].import.types.replace(/^\.\//, "");
    const [prefix, suffix] = pattern.split("*");
    const [file] = globSync(pattern).sort();
    if (!file) {
      console.error(`No built file matches the "${key}" export (${pattern}).`);
      process.exit(1);
    }
    return `"${key.replace("*", file.slice(prefix.length, file.length - suffix.length))}"`;
  })
  .join(" ");

const packDir = mkdtempSync(join(tmpdir(), "helius-sdk-pack-"));
let packageOk = false;
try {
  // --ignore-scripts: pack the existing build instead of rebuilding
  const tarball = execSync(`npm pack --ignore-scripts --pack-destination "${packDir}"`, {
    stdio: ["ignore", "pipe", "inherit"],
  })
    .toString().trim().split("\n").pop();
  console.log("Checking package exports with attw...");
  execSync(
    `attw "${join(packDir, tarball)}" --profile node16 --format table-flipped --include-entrypoints ${wildcardSamples}`,
    { stdio: "inherit" }
  );
  console.log("Success: package exports\n");
  packageOk = true;
} catch (error) {
  console.error(`Failure in package exports: ${error.message}`);
} finally {
  rmSync(packDir, { recursive: true, force: true });
}
if (!packageOk) process.exit(1);
