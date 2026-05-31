// File: backend/src/lib/notifications.ts
import { db } from '../db/connection.js';
import { notifications } from '../db/schema.js';

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}) {
  const [notification] = await db
    .insert(notifications)
    .values({
      id: generateUuid(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata || {},
      isRead: false,
      createdAt: new Date(),
    })
    .returning();

  return notification;
}

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
