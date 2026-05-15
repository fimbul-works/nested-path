import { defineConfig } from "tsdown";


export default defineConfig([
  {
    entry: {
      "nested-path": "src/index.ts",
    },
    platform: "browser",
    format: ["esm"],
    target: "es2022",
    dts: true,
    treeshake: true,
    outDir: "bundles",
    inputOptions: {
      optimization: {
        inlineConst: false,
      },
      experimental: {
        attachDebugInfo: "none",
      },
    },
  },
]);
