import { globSync } from "glob";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
    input: [
        "src/rpc/index.ts", // Slim factory (core RPC, no helpers)
        "src/rpc/full.ts", // Full factory (with all helpers)
        ...globSync("src/rpc/methods/*.ts"), // Individual methods for cherry-picking
        ...globSync("src/transactions/*.ts"), 
    ],
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
    external: ["@solana/kit"],
    treeshake: {
        moduleSideEffects: false
    }
};