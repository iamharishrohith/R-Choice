import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function clearDB() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  
  console.log("Dropping all tables...");
  try {
    await sql`DROP SCHEMA public CASCADE;`;
    await sql`CREATE SCHEMA public;`;
    console.log("Database wiped successfully!");
  } catch (error) {
    console.error("Error wiping database:", error);
  }
}

clearDB();
