import { globSync } from "glob";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
    input: [
        "src/rpc/index.ts",
        "src/rpc/createHelius.eager.ts",
        ...globSync("src/rpc/methods/*.ts"),
        ...globSync("src/transactions/*.ts"),
        ...globSync("src/webhooks/*.ts"),
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