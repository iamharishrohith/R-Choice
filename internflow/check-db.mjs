import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  const users = await sql`SELECT email, role FROM users WHERE role IN ('company', 'company_staff')`;
  console.log(users);
}
main();
