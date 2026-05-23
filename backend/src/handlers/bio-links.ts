import type { Context } from 'hono';
import { db, pool } from '../db/connection.js';
import { bioLinkProfile, bioLinks, bioLinkClicks } from '../db/schema.js';
import { eq, sql, desc, asc } from 'drizzle-orm';

// ── Helpers ──────────────────────────────────────────────────────────────────

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function sanitizeUrl(url: string): string {
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  return trimmed;
}

// ── Public endpoints ──────────────────────────────────────────────────────────

export async function getPublicBioLinks(c: Context) {
  try {
    const [profileRes, linksRes] = await Promise.all([
      pool.query('SELECT * FROM bio_link_profile LIMIT 1'),
      pool.query(
        'SELECT id, title, url, icon, sort_order FROM bio_links WHERE is_active = true ORDER BY sort_order ASC, created_at ASC'
      ),
    ]);

    const profile = profileRes.rows[0] || {
      account_name: 'Steak Kenangan',
      bio_text: 'Premium steaks crafted with passion',
      avatar_url: null,
      theme_color: '#e5612f',
      noindex: true,
    };

    return c.json({
      success: true,
      data: {
        profile: {
          account_name: profile.account_name,
          bio_text: profile.bio_text,
          avatar_url: profile.avatar_url,
          theme_color: profile.theme_color,
          noindex: profile.noindex,
        },
        links: linksRes.rows,
      },
    });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to fetch bio links',
      error: (err as Error).message,
    }, 500);
  }
}

export async function trackBioLinkClick(c: Context) {
  const linkId = c.req.param('id');

  try {
    const linkRes = await pool.query(
      'SELECT id, url, is_active FROM bio_links WHERE id = $1',
      [linkId]
    );

    if (linkRes.rows.length === 0) {
      return c.json({ success: false, message: 'Link not found' }, 404);
    }

    const link = linkRes.rows[0];
    if (!link.is_active) {
      return c.json({ success: false, message: 'Link is inactive' }, 410);
    }

    const ipAddress = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || 'unknown';
    const userAgent = c.req.header('user-agent')?.substring(0, 500) || null;
    const referrer = c.req.header('referer')?.substring(0, 500) || null;

    await Promise.all([
      pool.query(
        'UPDATE bio_links SET click_count = click_count + 1 WHERE id = $1',
        [linkId]
      ),
      pool.query(
        'INSERT INTO bio_link_clicks (link_id, ip_address, user_agent, referrer) VALUES ($1, $2, $3, $4)',
        [linkId, ipAddress, userAgent, referrer]
      ),
    ]);

    return c.json({ success: true, data: { url: link.url } });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to track click',
      error: (err as Error).message,
    }, 500);
  }
}

// ── Admin: Profile ────────────────────────────────────────────────────────────

export async function getBioLinkProfile(c: Context) {
  try {
    const res = await pool.query('SELECT * FROM bio_link_profile LIMIT 1');
    const profile = res.rows[0] || null;
    return c.json({ success: true, data: profile });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to fetch bio link profile',
      error: (err as Error).message,
    }, 500);
  }
}

export async function updateBioLinkProfile(c: Context) {
  try {
    const body = await c.req.json();

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return c.json({ success: false, message: 'Request body is empty' }, 400);
    }

    const fields = ['account_name', 'bio_text', 'avatar_url', 'theme_color', 'noindex', 'is_active'];
    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${idx}`);
        params.push(body[field]);
        idx++;
      }
    }

    if (updates.length === 0) {
      return c.json({ success: false, message: 'No valid fields to update', debug_keys: Object.keys(body) }, 400);
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      INSERT INTO bio_link_profile (account_name, bio_text, avatar_url, theme_color, noindex, is_active)
      VALUES ($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5})
      ON CONFLICT ((TRUE)) DO UPDATE SET ${updates.join(', ')}
      RETURNING *
    `;

    const defaultName = body.account_name || 'Steak Kenangan';
    const defaultBio = body.bio_text || '';
    const defaultAvatar = body.avatar_url || null;
    const defaultTheme = body.theme_color || '#e5612f';
    const defaultNoindex = body.noindex !== undefined ? body.noindex : true;
    const defaultActive = body.is_active !== undefined ? body.is_active : true;

    params.push(defaultName, defaultBio, defaultAvatar, defaultTheme, defaultNoindex, defaultActive);

    const res = await pool.query(query, params);
    return c.json({ success: true, data: res.rows[0] });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to update bio link profile',
      error: (err as Error).message,
    }, 500);
  }
}

// ── Admin: Links CRUD ─────────────────────────────────────────────────────────

export async function getBioLinks(c: Context) {
  try {
    const res = await pool.query(
      'SELECT * FROM bio_links ORDER BY sort_order ASC, created_at ASC'
    );
    return c.json({ success: true, data: res.rows });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to fetch bio links',
      error: (err as Error).message,
    }, 500);
  }
}

export async function createBioLink(c: Context) {
  try {
    const body = await c.req.json();

    if (!body.title || !body.url) {
      return c.json({ success: false, message: 'Title and URL are required' }, 400);
    }

    const sanitizedUrl = sanitizeUrl(body.url);
    if (!isValidUrl(sanitizedUrl)) {
      return c.json({ success: false, message: 'Invalid URL format. Only http:// and https:// are allowed.' }, 400);
    }

    const maxOrderRes = await pool.query('SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM bio_links');
    const nextOrder = maxOrderRes.rows[0].next_order;

    const res = await pool.query(
      'INSERT INTO bio_links (title, url, icon, is_active, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        body.title,
        sanitizedUrl,
        body.icon || null,
        body.is_active !== undefined ? body.is_active : true,
        body.sort_order !== undefined ? body.sort_order : nextOrder,
      ]
    );

    return c.json({ success: true, data: res.rows[0] }, 201);
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to create bio link',
      error: (err as Error).message,
    }, 500);
  }
}

export async function updateBioLink(c: Context) {
  const linkId = c.req.param('id');

  try {
    const body = await c.req.json();

    if (body.url !== undefined) {
      const sanitizedUrl = sanitizeUrl(body.url);
      if (!isValidUrl(sanitizedUrl)) {
        return c.json({ success: false, message: 'Invalid URL format. Only http:// and https:// are allowed.' }, 400);
      }
      body.url = sanitizedUrl;
    }

    const fields = ['title', 'url', 'icon', 'is_active', 'sort_order'];
    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${idx}`);
        params.push(body[field]);
        idx++;
      }
    }

    if (updates.length === 0) {
      return c.json({ success: false, message: 'No fields to update' }, 400);
    }

    updates.push(`updated_at = NOW()`);
    params.push(linkId);

    const res = await pool.query(
      `UPDATE bio_links SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (res.rows.length === 0) {
      return c.json({ success: false, message: 'Link not found' }, 404);
    }

    return c.json({ success: true, data: res.rows[0] });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to update bio link',
      error: (err as Error).message,
    }, 500);
  }
}

export async function deleteBioLink(c: Context) {
  const linkId = c.req.param('id');

  try {
    const res = await pool.query(
      'DELETE FROM bio_links WHERE id = $1 RETURNING id',
      [linkId]
    );

    if (res.rows.length === 0) {
      return c.json({ success: false, message: 'Link not found' }, 404);
    }

    return c.json({ success: true, message: 'Link deleted' });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to delete bio link',
      error: (err as Error).message,
    }, 500);
  }
}

export async function reorderBioLinks(c: Context) {
  try {
    const body = await c.req.json();

    if (!Array.isArray(body.items)) {
      return c.json({ success: false, message: 'items array is required' }, 400);
    }

    for (const item of body.items) {
      if (!item.id || item.sort_order === undefined) {
        return c.json({ success: false, message: 'Each item must have id and sort_order' }, 400);
      }
    }

    await pool.query('BEGIN');

    for (const item of body.items) {
      await pool.query(
        'UPDATE bio_links SET sort_order = $1, updated_at = NOW() WHERE id = $2',
        [item.sort_order, item.id]
      );
    }

    await pool.query('COMMIT');

    const res = await pool.query(
      'SELECT * FROM bio_links ORDER BY sort_order ASC, created_at ASC'
    );

    return c.json({ success: true, data: res.rows });
  } catch (err) {
    await pool.query('ROLLBACK');
    return c.json({
      success: false,
      message: 'Failed to reorder bio links',
      error: (err as Error).message,
    }, 500);
  }
}

// ── Admin: Analytics ──────────────────────────────────────────────────────────

export async function getBioLinkAnalytics(c: Context) {
  const linkId = c.req.param('id');

  try {
    const linkRes = await pool.query(
      'SELECT id, title, click_count FROM bio_links WHERE id = $1',
      [linkId]
    );

    if (linkRes.rows.length === 0) {
      return c.json({ success: false, message: 'Link not found' }, 404);
    }

    const analyticsRes = await pool.query(
      `SELECT DATE(clicked_at) as date, COUNT(*) as clicks
       FROM bio_link_clicks
       WHERE link_id = $1 AND clicked_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(clicked_at)
       ORDER BY date ASC`,
      [linkId]
    );

    return c.json({
      success: true,
      data: {
        link: linkRes.rows[0],
        daily_clicks: analyticsRes.rows.map((row: Record<string, unknown>) => ({
          date: row.date,
          clicks: Number(row.clicks),
        })),
      },
    });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to fetch analytics',
      error: (err as Error).message,
    }, 500);
  }
}
