import { defineConfig } from "vite-plus";
import core from "ultracite/oxlint/core";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  lint: {
    extends: [core],
    rules: {
      "unicorn/number-literal-case": "off",
      "unicorn/numeric-separators-style": "off",
    },
  },
  fmt: {
    extends: [ultracite],
  },
});
