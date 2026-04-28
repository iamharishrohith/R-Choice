import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import dns from "node:dns";
import tls from "node:tls";

// Fix Node.js IPv6 and TLS 1.3 resolution/inspection issues with Neon on Windows
dns.setDefaultResultOrder("ipv4first");
tls.DEFAULT_MAX_VERSION = 'TLSv1.2';

// Global singleton to avoid re-creating connection on every hot-reload
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

if (!globalForDb.db) {
  const sql = neon(process.env.DATABASE_URL!);
  globalForDb.db = drizzle(sql, { schema });
}

export const db = globalForDb.db;
