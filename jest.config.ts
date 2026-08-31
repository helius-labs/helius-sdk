import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/__tests__/**/*.ts", "**/*.test.ts"],
    moduleFileExtensions: ["ts", "js", "json"],
    // Resolve ESM-style ".js" specifiers (e.g. lazy `import("./x.js")`) to
    // their TypeScript sources so lazy-loaded modules work under Jest
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    transform: {
        "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }]
    },
    clearMocks: true,
    verbose: true,
    collectCoverage: true,
    collectCoverageFrom: ["src/**/*.ts"],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov"],
    // At least 65% test coverage across all metrics
    coverageThreshold: {
        global: {
            branches: 65,
            functions: 65,
            lines: 65,
            statements: 65
        }
    }
};

export default config;