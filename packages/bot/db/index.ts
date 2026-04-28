import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema/index.js";

const sqlite = new Database("./mydb.sqlite");
export const db = drizzle({ client: sqlite, schema });
