import { globSync } from "glob";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

// Every TS file under src/ will be included, with tests excluded
const inputs = globSync('src/**/*.ts', {
  ignore: ['**/*.test.ts', '**/*.spec.ts', 'src/main.ts'],
});

const external = ["@solana/kit", "@solana-program/compute-budget", "@solana-program/stake", "@solana-program/system", "@solana-program/token", "bs58"];

// The CJS build's declarations become .d.cts with .cjs relative specifiers.
// In this "type": "module" package a .d.ts is read as ESM, which CommonJS
// consumers under node16 reject (TS1479).
const cjsDeclarations = () => ({
  name: "cjs-declarations",
  generateBundle(_options, bundle) {
    for (const [fileName, asset] of Object.entries(bundle)) {
      if (asset.type !== "asset" || !fileName.endsWith(".d.ts")) continue;
      const source = String(asset.source).replace(
        /(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+|\bdeclare\s+module\s+)(["'])(\.{1,2}\/[^"']*)\.js\2/g,
        "$1$2$3.cjs$2"
      );
      delete bundle[fileName];
      this.emitFile({ type: "asset", fileName: fileName.replace(/\.d\.ts$/, ".d.cts"), source });
    }
  },
});

const baseConfig = {
  input: inputs,
  plugins: [
    resolve({ extensions: [".ts", ".js"] }),
    commonjs(),
  ],
  treeshake: {
    moduleSideEffects: false
  },
  external,
};

export default [
  // ESM build
  {
    ...baseConfig,
    output: {
      dir: "dist/esm",
      format: "esm",
      entryFileNames: "[name].js",
      chunkFileNames: "[name]-[hash].js",
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: "src",
    },
    plugins: [
      ...baseConfig.plugins,
      typescript({
        tsconfig: "./tsconfig.build.json",
        declaration: true,
        declarationMap: true,
        outDir: "dist/esm",
        rootDir: "src",
      })
    ],
  },
  // CommonJS build
  {
    ...baseConfig,
    output: {
      dir: "dist/cjs",
      format: "cjs",
      entryFileNames: "[name].cjs",
      chunkFileNames: "[name]-[hash].cjs",
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: "src",
      exports: "named",
    },
    plugins: [
      ...baseConfig.plugins,
      typescript({
        tsconfig: "./tsconfig.build.json",
        declaration: true,
        declarationMap: false, // The maps point at src/, which isn't published
        outDir: "dist/cjs",
        rootDir: "src",
      }),
      cjsDeclarations(),
    ],
  },
];