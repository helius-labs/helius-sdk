import { globSync } from "glob";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

// Every TS file under src/ will be included, with tests excluded
const inputs = globSync('src/**/*.ts', {
  ignore: ['**/*.test.ts', '**/*.spec.ts', 'src/main.ts'],
});

const external = ["@solana/kit", "@solana-program/compute-budget", "@solana-program/stake", "@solana-program/system", "bs58"];

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
        tsconfig: "./tsconfig.json",
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
        tsconfig: "./tsconfig.json",
        declaration: false, // Only generate types once (in ESM build)
        declarationMap: false,
        outDir: "dist/cjs",
        rootDir: "src",
      })
    ],
  },
];