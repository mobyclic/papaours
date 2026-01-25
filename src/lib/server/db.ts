import { connectDB } from '$lib/db';

export async function getSurrealDB() {
  return await connectDB();
}
