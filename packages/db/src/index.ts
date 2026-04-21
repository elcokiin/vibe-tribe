import { neon } from "@neondatabase/serverless";
import { env } from "@vibetribe/env/server";
import { drizzle } from "drizzle-orm/neon-http";

import * as authSchema from "./schema/auth.js";
import * as profileSchema from "./schema/profile.js";
import * as todoSchema from "./schema/todo.js";
import * as packageSchema from "./schema/package.js";

const sql = neon(env.DATABASE_URL);
const schema = { ...authSchema, ...profileSchema, ...todoSchema, ...packageSchema };
export const db = drizzle(sql, { schema });
