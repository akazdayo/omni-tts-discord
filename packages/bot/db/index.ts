import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { Database } from "bun:sqlite";
import * as schema from "./schema/index.js";

const sqlite = new Database("./mydb.sqlite");
export const db = drizzle({ client: sqlite, schema });
migrate(db, { migrationsFolder: `${import.meta.dir}/../drizzle` });
