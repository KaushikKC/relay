import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "components/index": "src/components/index.ts",
    "hooks/index": "src/hooks/index.ts",
    "utils/index": "src/utils/index.ts",
    "config/index": "src/config/index.ts",
    "types/index": "src/types/index.ts",
  },
  format: ["cjs", "esm"],
  dts: {
    resolve: true,
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "wagmi",
    "viem",
    "@tanstack/react-query",
    "next",
  ],
  treeshake: true,
  minify: false,
  tsconfig: "./tsconfig.json",
});
