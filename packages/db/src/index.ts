import { neon } from "@neondatabase/serverless";
import { env } from "@vibetribe/env/server";
import { drizzle } from "drizzle-orm/neon-http";

import * as authSchema from "./schema/auth.js";
import * as todoSchema from "./schema/todo.js";

const sql = neon(env.DATABASE_URL);
const schema = { ...authSchema, ...todoSchema };
export const db = drizzle(sql, { schema });
