import { defineConfig } from "vite-plus";
import core from "ultracite/oxlint/core";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  fmt: {
    extends: [ultracite],
  },
  lint: {
    extends: [core],
    rules: {
      "unicorn/number-literal-case": "off",
      "unicorn/numeric-separators-style": "off",
    },
  },
});
