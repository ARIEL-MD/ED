// Usage : npx tsx src/scripts/createAdmin.ts +2250700000000 "Nom" "motdepasse-long"
import bcrypt from "bcryptjs";
import { db } from "../db";
(async () => {
  const [phone, name, pw] = process.argv.slice(2);
  if (!phone || !name || !pw || pw.length < 10) { console.error("phone name password(>=10)"); process.exit(1); }
  await db.query("INSERT INTO users(role,name,phone,password_hash) VALUES('admin',$1,$2,$3)", [name, phone, await bcrypt.hash(pw, 12)]);
  console.log("Admin créé"); await db.end();
})();
