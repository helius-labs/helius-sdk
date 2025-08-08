import { globSync } from "glob";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

// Every TS file under src/ will be included, with tests excluded
const inputs = globSync('src/**/*.ts', {
  ignore: ['**/*.test.ts', '**/*.spec.ts', 'src/main.ts'],
});

export default {
    input: inputs,
    output: {
        dir: "dist",
        format: "esm",
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].js", // For any chunks, which should be rare with preserveModules
        sourcemap: true,
        preserveModules: true,
        preserveModulesRoot: "src",
    },
    plugins: [
        resolve({ extensions: [".ts", ".js"] }),
        commonjs(),
        typescript({
            tsconfig: "./tsconfig.json",
            declaration: true,
            declarationMap: true,
            outDir: "dist",
            rootDir: "src",
        })
    ],
    treeshake: {
        moduleSideEffects: false
    },
    external: ["@solana/kit", "@solana-program/compute-budget", "@solana-program/stake", "@solana-program/system", "bs58"],
};