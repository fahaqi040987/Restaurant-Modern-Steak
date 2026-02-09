import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { db } from '../db/connection.js';

// ── Helper: stripHTMLTags ──────────────────────────────────────────────────

function stripHTMLTags(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

// ── CreateSurvey (customer-facing) ──────────────────────────────────────────

export async function createSurvey(c: Context) {
  const orderId = c.req.param('id');

  let body: {
    overall_rating: number;
    food_quality?: number | null;
    service_quality?: number | null;
    ambiance?: number | null;
    value_for_money?: number | null;
    comments?: string | null;
    would_recommend?: boolean | null;
    customer_name?: string | null;
    customer_email?: string | null;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Invalid request format' }, 400);
  }

  // Sanitize comments
  if (body.comments) {
    body.comments = stripHTMLTags(body.comments);
  }

  // Validate overall_rating
  if (!body.overall_rating || body.overall_rating < 1 || body.overall_rating > 5) {
    return c.json({ success: false, error: 'Overall rating must be between 1 and 5' }, 400);
  }

  try {
    // Check if order exists and is completed
    const orderRes = await db.execute<{ status: string }>(sql`
      SELECT status FROM orders WHERE id = ${orderId}
    `);

    if (orderRes.rows.length === 0) {
      return c.json({ success: false, error: 'Order not found' }, 404);
    }

    const orderStatus = orderRes.rows[0].status;
    if (orderStatus !== 'completed' && orderStatus !== 'paid') {
      return c.json({ success: false, error: 'Survey can only be submitted for completed orders' }, 400);
    }

    // Check if survey already exists
    const existingRes = await db.execute<{ id: string }>(sql`
      SELECT id FROM satisfaction_surveys WHERE order_id = ${orderId}
    `);

    if (existingRes.rows.length > 0) {
      return c.json({ success: false, error: 'Survey already submitted for this order' }, 409);
    }

    // Insert survey
    const insertRes = await db.execute<{ id: string }>(sql`
      INSERT INTO satisfaction_surveys (
        order_id, overall_rating, food_quality, service_quality,
        ambiance, value_for_money, comments, would_recommend,
        customer_name, customer_email
      ) VALUES (
        ${orderId}, ${body.overall_rating}, ${body.food_quality ?? null}, ${body.service_quality ?? null},
        ${body.ambiance ?? null}, ${body.value_for_money ?? null}, ${body.comments ?? null}, ${body.would_recommend ?? null},
        ${body.customer_name ?? null}, ${body.customer_email ?? null}
      )
      RETURNING id
    `);

    return c.json({
      success: true,
      message: 'Survey submitted successfully',
      data: {
        id: insertRes.rows[0].id,
        order_id: orderId,
      },
    }, 201);
  } catch {
    return c.json({ success: false, error: 'Failed to submit survey' }, 500);
  }
}

// ── GetSurveyStats (admin) ──────────────────────────────────────────────────

export async function getSurveyStats(c: Context) {
  try {
    // Query aggregated statistics
    const statsRes = await db.execute<{
      total_surveys: string;
      average_rating: string;
      average_food_quality: string;
      average_service_quality: string;
      average_ambiance: string;
      average_value_for_money: string;
      recommendation_rate: string;
    }>(sql`
      SELECT
        COUNT(*) as total_surveys,
        COALESCE(AVG(overall_rating), 0) as average_rating,
        COALESCE(AVG(food_quality), 0) as average_food_quality,
        COALESCE(AVG(service_quality), 0) as average_service_quality,
        COALESCE(AVG(ambiance), 0) as average_ambiance,
        COALESCE(AVG(value_for_money), 0) as average_value_for_money,
        COALESCE(
          SUM(CASE WHEN would_recommend = true THEN 1 ELSE 0 END)::float /
          NULLIF(COUNT(would_recommend), 0) * 100,
          0
        ) as recommendation_rate
      FROM satisfaction_surveys
    `);

    const stats = statsRes.rows[0];

    // Get rating distribution
    const distRes = await db.execute<{
      overall_rating: number;
      count: string;
    }>(sql`
      SELECT overall_rating, COUNT(*) as count
      FROM satisfaction_surveys
      GROUP BY overall_rating
      ORDER BY overall_rating
    `);

    const ratingDistribution: Record<number, number> = {};
    for (const row of distRes.rows) {
      ratingDistribution[row.overall_rating] = Number(row.count);
    }

    return c.json({
      success: true,
      data: {
        total_surveys: Number(stats.total_surveys),
        average_rating: Number(stats.average_rating),
        average_food_quality: Number(stats.average_food_quality),
        average_service_quality: Number(stats.average_service_quality),
        average_ambiance: Number(stats.average_ambiance),
        average_value_for_money: Number(stats.average_value_for_money),
        recommendation_rate: Number(stats.recommendation_rate),
        rating_distribution: ratingDistribution,
      },
    });
  } catch {
    return c.json({ success: false, error: 'Failed to fetch survey statistics' }, 500);
  }
}
