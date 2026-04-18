import { defineConfig } from "oxlint";

import core from "ultracite/oxlint/core";

export default defineConfig({
  extends: [core],
  rules: {
    "unicorn/number-literal-case": "off",
    "unicorn/numeric-separators-style": "off",
  },
});
