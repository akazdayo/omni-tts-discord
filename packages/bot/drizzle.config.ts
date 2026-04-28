import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dbCredentials: {
    url: "./mydb.sqlite",
  },
  dialect: "sqlite",
  out: "./drizzle",
  schema: "./db/schema/",
});
