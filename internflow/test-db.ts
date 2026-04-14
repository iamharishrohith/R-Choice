import { db } from "./src/lib/db";
import { studentProfiles } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    const res = await db.select().from(studentProfiles).limit(1);
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
main();
