import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { db, pool } from '../db/connection.js';

const VALID_SECTIONS = ['vision_mission', 'packages', 'investment'] as const;
type Section = (typeof VALID_SECTIONS)[number];

function isValidSection(section: string): section is Section {
  return VALID_SECTIONS.includes(section as Section);
}

function validateVisionMission(content: unknown): string | null {
  const c = content as Record<string, unknown>;
  if (!c.vision || typeof c.vision !== 'object') return 'vision is required and must be an object';
  const v = c.vision as Record<string, unknown>;
  if (!v.id || !v.en) return 'vision must have id and en fields';
  if (!Array.isArray(c.missions) || c.missions.length === 0) return 'missions must be a non-empty array';
  for (const m of c.missions) {
    if (!m.id || !m.en) return 'each mission must have id and en fields';
  }
  return null;
}

function validatePackages(content: unknown): string | null {
  const c = content as Record<string, unknown>;
  if (!Array.isArray(c.packages) || c.packages.length === 0) return 'packages must be a non-empty array';
  for (const pkg of c.packages) {
    if (!pkg.slug) return 'each package must have a slug';
    if (!pkg.name?.id || !pkg.name?.en) return `package "${pkg.slug}" must have name with id and en`;
    if (!pkg.description?.id || !pkg.description?.en) return `package "${pkg.slug}" must have description with id and en`;
    if (!pkg.highlights?.id || !pkg.highlights?.en) return `package "${pkg.slug}" must have highlights with id and en`;
    if (!pkg.priceRange?.id || !pkg.priceRange?.en) return `package "${pkg.slug}" must have priceRange with id and en`;
  }
  return null;
}

function validateInvestment(content: unknown): string | null {
  const c = content as Record<string, unknown>;
  if (!c.title?.id || !c.title?.en) return 'title must have id and en fields';
  if (!c.subtitle?.id || !c.subtitle?.en) return 'subtitle must have id and en fields';
  if (!c.roiEstimate?.id || !c.roiEstimate?.en) return 'roiEstimate must have id and en fields';
  if (!Array.isArray(c.benefits) || c.benefits.length === 0) return 'benefits must be a non-empty array';
  for (const b of c.benefits) {
    if (!b.id || !b.en || !b.icon) return 'each benefit must have id, en, and icon';
  }
  return null;
}

const validators: Record<Section, (content: unknown) => string | null> = {
  vision_mission: validateVisionMission,
  packages: validatePackages,
  investment: validateInvestment,
};

// ── Get all franchise content ──────────────────────────────────────────────────

export async function getFranchiseContent(c: Context) {
  try {
    const res = await db.execute<{
      section: string;
      content: unknown;
    }>(sql`SELECT section, content FROM franchise_content ORDER BY section`);

    const data: Record<string, unknown> = {};
    for (const row of res.rows) {
      data[row.section] = row.content;
    }

    return c.json({
      success: true,
      data,
    });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to fetch franchise content',
      error: (err as Error).message,
    }, 500);
  }
}

// ── Get franchise content by section ───────────────────────────────────────────

export async function getFranchiseContentBySection(c: Context) {
  const section = c.req.param('section');

  if (!isValidSection(section)) {
    return c.json({
      success: false,
      message: `Invalid section. Must be one of: ${VALID_SECTIONS.join(', ')}`,
    }, 400);
  }

  try {
    const res = await db.execute<{
      section: string;
      content: unknown;
    }>(sql`SELECT section, content FROM franchise_content WHERE section = ${section}`);

    if (res.rows.length === 0) {
      return c.json({
        success: true,
        data: null,
      });
    }

    return c.json({
      success: true,
      data: res.rows[0].content,
    });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to fetch franchise content',
      error: (err as Error).message,
    }, 500);
  }
}

// ── Update franchise content by section ────────────────────────────────────────

export async function updateFranchiseContent(c: Context) {
  const section = c.req.param('section');

  if (!isValidSection(section)) {
    return c.json({
      success: false,
      message: `Invalid section. Must be one of: ${VALID_SECTIONS.join(', ')}`,
    }, 400);
  }

  let content: unknown;
  try {
    content = await c.req.json();
  } catch {
    return c.json({
      success: false,
      message: 'Invalid request body',
    }, 400);
  }

  const validationError = validators[section](content);
  if (validationError) {
    return c.json({
      success: false,
      message: validationError,
    }, 400);
  }

  const userId = c.get('user_id');

  try {
    await pool.query(
      `INSERT INTO franchise_content (section, content, updated_by, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (section) DO UPDATE SET
         content = EXCLUDED.content,
         updated_by = EXCLUDED.updated_by,
         updated_at = NOW()`,
      [section, JSON.stringify(content), userId],
    );

    return c.json({
      success: true,
      message: 'Franchise content updated successfully',
      data: content,
    });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to update franchise content',
      error: (err as Error).message,
    }, 500);
  }
}
