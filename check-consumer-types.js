import { globSync } from "glob";
import { execSync } from "child_process";
import { existsSync, lstatSync, mkdirSync, symlinkSync, unlinkSync } from "fs";
import { relative, resolve } from "path";

// Typecheck small consumer projects against the built package under each
// module resolution mode consumers use. Declarations that a mode can't
// resolve turn the SDK's types into `any` without an error (skipLibCheck
// hides it), so the fixtures assert real types with @ts-expect-error.
const fixtures = resolve("test/consumer-types");

if (!existsSync(resolve("dist/esm/rpc/index.d.ts"))) {
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
