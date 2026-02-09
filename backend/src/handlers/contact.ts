import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { db, pool } from '../db/connection.js';

// ── GetNewContactsCount ──────────────────────────────────────────────────────

export async function getNewContactsCount(c: Context) {
  try {
    const res = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count FROM contact_submissions WHERE status = 'new'
    `);

    return c.json({
      success: true,
      data: {
        new_contacts: Number(res.rows[0].count),
      },
    });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to fetch new contacts count',
      error: (err as Error).message,
    }, 500);
  }
}

// ── GetContactSubmissions ──────────────────────────────────────────────────────

export async function getContactSubmissions(c: Context) {
  const status = c.req.query('status') || '';
  const startDate = c.req.query('start_date') || '';
  const endDate = c.req.query('end_date') || '';

  try {
    let query = `
      SELECT id, name, email, phone, subject, message, status, created_at, updated_at
      FROM contact_submissions
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let argIndex = 1;

    if (status) {
      query += ` AND status = $${argIndex}`;
      params.push(status);
      argIndex++;
    }

    if (startDate) {
      query += ` AND created_at >= $${argIndex}`;
      params.push(startDate);
      argIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${argIndex}`;
      params.push(endDate);
      argIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const res = await pool.query(query, params);

    const submissions = res.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      subject: row.subject,
      message: row.message,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    // Return raw array (matches Go behavior)
    return c.json(submissions, 200);
  } catch {
    return c.json({ error: 'Failed to fetch contact submissions' }, 500);
  }
}

// ── GetContactSubmission ──────────────────────────────────────────────────────

export async function getContactSubmission(c: Context) {
  const id = c.req.param('id');

  try {
    const res = await db.execute<{
      id: string;
      name: string;
      email: string;
      phone: string;
      subject: string;
      message: string;
      status: string;
      created_at: string;
      updated_at: string;
    }>(sql`
      SELECT id, name, email, phone, subject, message, status, created_at, updated_at
      FROM contact_submissions WHERE id = ${id}
    `);

    if (res.rows.length === 0) {
      return c.json({ error: 'Contact submission not found' }, 404);
    }

    const row = res.rows[0];
    // Return raw object (matches Go behavior)
    return c.json({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      subject: row.subject,
      message: row.message,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }, 200);
  } catch {
    return c.json({ error: 'Contact submission not found' }, 404);
  }
}

// ── UpdateContactStatus ──────────────────────────────────────────────────────

export async function updateContactStatus(c: Context) {
  const id = c.req.param('id');

  let body: { status: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  if (!body.status) {
    return c.json({ error: 'Status is required' }, 400);
  }

  const validStatuses = ['new', 'in_progress', 'resolved', 'spam'];
  if (!validStatuses.includes(body.status)) {
    return c.json({ error: 'Invalid status. Must be one of: new, in_progress, resolved, spam' }, 400);
  }

  try {
    const res = await db.execute<{
      id: string;
      name: string;
      email: string;
      phone: string;
      subject: string;
      message: string;
      status: string;
      created_at: string;
      updated_at: string;
    }>(sql`
      UPDATE contact_submissions
      SET status = ${body.status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, email, phone, subject, message, status, created_at, updated_at
    `);

    if (res.rows.length === 0) {
      return c.json({ error: 'Contact submission not found' }, 404);
    }

    const row = res.rows[0];
    // Return raw object (matches Go behavior)
    return c.json({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      subject: row.subject,
      message: row.message,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }, 200);
  } catch {
    return c.json({ error: 'Contact submission not found' }, 404);
  }
}

// ── DeleteContactSubmission ──────────────────────────────────────────────────

export async function deleteContactSubmission(c: Context) {
  const id = c.req.param('id');

  try {
    const res = await db.execute(sql`
      DELETE FROM contact_submissions WHERE id = ${id}
    `);

    if (res.rowCount === 0) {
      return c.json({ error: 'Contact submission not found' }, 404);
    }

    return c.json({ message: 'Contact submission deleted successfully' }, 200);
  } catch {
    return c.json({ error: 'Failed to delete contact submission' }, 500);
  }
}
