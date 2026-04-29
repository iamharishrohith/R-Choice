import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "./src/lib/db";
import { studentProfiles } from "./src/lib/db/schema";

async function run() {
    try {
        const profiles = await db.select().from(studentProfiles);
        console.log("Profiles in DB:");
        profiles.forEach(p => {
            console.log(`program: ${p.program}, course: ${p.course}, department: ${p.department}, programType: ${p.programType}`);
        });
    } catch (e) {
        console.error(e);
    }
}
run();
