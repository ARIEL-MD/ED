import { Pool } from "pg";
export const db = new Pool({ connectionString: process.env.DATABASE_URL });
export async function notify(userId: string, kind: string, body: string, bookingId?: string) {
  await db.query("INSERT INTO notifications(user_id,kind,body,booking_id) VALUES($1,$2,$3,$4)", [userId, kind, body, bookingId ?? null]);
}
