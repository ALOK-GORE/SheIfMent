import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  const fallbackUsername = email.split('@')[0]?.slice(0, 50) || 'user';
  const username = (displayName?.trim() || fallbackUsername).slice(0, 50);

  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        username,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          username,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database user upsert failed:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}
