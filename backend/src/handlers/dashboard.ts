import type { Context } from 'hono';
import { pool } from '../db/connection.js';

// ── GetDashboardStats ────────────────────────────────────────────────────────

export async function getDashboardStats(c: Context) {
  try {
    const stats: Record<string, unknown> = {};

    // Today's orders
    const todayOrdersRes = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE`,
    );
    stats.today_orders = Number(todayOrdersRes.rows[0].count);

    // Today's revenue
    const todayRevenueRes = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed'`,
    );
    stats.today_revenue = Number(todayRevenueRes.rows[0].total);

    // Active orders
    const activeOrdersRes = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE status NOT IN ('completed', 'cancelled')`,
    );
    stats.active_orders = Number(activeOrdersRes.rows[0].count);

    // Occupied tables
    const occupiedTablesRes = await pool.query(
      `SELECT COUNT(*) FROM dining_tables WHERE is_occupied = true`,
    );
    stats.occupied_tables = Number(occupiedTablesRes.rows[0].count);

    return c.json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: stats,
    });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: (err as Error).message,
    }, 500);
  }
}

// ── GetSalesReport ───────────────────────────────────────────────────────────

export async function getSalesReport(c: Context) {
  const period = c.req.query('period') || 'today';

  let query: string;
  switch (period) {
    case 'week':
      query = `
        SELECT DATE(created_at) as date, COUNT(*) as order_count, SUM(total_amount) as revenue
        FROM orders
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      break;
    case 'month':
      query = `
        SELECT DATE(created_at) as date, COUNT(*) as order_count, SUM(total_amount) as revenue
        FROM orders
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      break;
    default: // today
      query = `
        SELECT DATE_TRUNC('hour', created_at) as hour, COUNT(*) as order_count, SUM(total_amount) as revenue
        FROM orders
        WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed'
        GROUP BY DATE_TRUNC('hour', created_at)
        ORDER BY hour DESC
      `;
  }

  try {
    const res = await pool.query(query);
    const report = res.rows.map((row: Record<string, unknown>) => ({
      date: row.date || row.hour,
      order_count: Number(row.order_count),
      revenue: Number(row.revenue),
    }));

    return c.json({
      success: true,
      message: 'Sales report retrieved successfully',
      data: report,
    });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to fetch sales report',
      error: (err as Error).message,
    }, 500);
  }
}

// ── GetOrdersReport ──────────────────────────────────────────────────────────

export async function getOrdersReport(c: Context) {
  try {
    const res = await pool.query(`
      SELECT
        status,
        COUNT(*) as count,
        AVG(total_amount) as avg_amount
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
      GROUP BY status
    `);

    const report = res.rows.map((row: Record<string, unknown>) => ({
      status: row.status,
      count: Number(row.count),
      avg_amount: Number(row.avg_amount),
    }));

    return c.json({
      success: true,
      message: 'Orders report retrieved successfully',
      data: report,
    });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to fetch orders report',
      error: (err as Error).message,
    }, 500);
  }
}

// ── GetIncomeReport ──────────────────────────────────────────────────────────

export async function getIncomeReport(c: Context) {
  const period = c.req.query('period') || 'today';

  let query: string;
  switch (period) {
    case 'week':
      query = `
        SELECT
          DATE_TRUNC('day', created_at) as period,
          COUNT(*) as total_orders,
          SUM(total_amount) as gross_income,
          SUM(tax_amount) as tax_collected,
          SUM(total_amount - tax_amount) as net_income
        FROM orders
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
          AND status = 'completed'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY period DESC
      `;
      break;
    case 'month':
      query = `
        SELECT
          DATE_TRUNC('day', created_at) as period,
          COUNT(*) as total_orders,
          SUM(total_amount) as gross_income,
          SUM(tax_amount) as tax_collected,
          SUM(total_amount - tax_amount) as net_income
        FROM orders
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
          AND status = 'completed'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY period DESC
      `;
      break;
    case 'year':
      query = `
        SELECT
          DATE_TRUNC('month', created_at) as period,
          COUNT(*) as total_orders,
          SUM(total_amount) as gross_income,
          SUM(tax_amount) as tax_collected,
          SUM(total_amount - tax_amount) as net_income
        FROM orders
        WHERE created_at >= CURRENT_DATE - INTERVAL '1 year'
          AND status = 'completed'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY period DESC
      `;
      break;
    default: // today
      query = `
        SELECT
          DATE_TRUNC('hour', created_at) as period,
          COUNT(*) as total_orders,
          SUM(total_amount) as gross_income,
          SUM(tax_amount) as tax_collected,
          SUM(total_amount - tax_amount) as net_income
        FROM orders
        WHERE DATE(created_at) = CURRENT_DATE
          AND status = 'completed'
        GROUP BY DATE_TRUNC('hour', created_at)
        ORDER BY period DESC
      `;
  }

  try {
    const res = await pool.query(query);

    let totalOrders = 0;
    let totalGross = 0;
    let totalTax = 0;
    let totalNet = 0;

    const breakdown = res.rows.map((row: Record<string, unknown>) => {
      const orders = Number(row.total_orders);
      const gross = Number(row.gross_income);
      const tax = Number(row.tax_collected);
      const net = Number(row.net_income);

      totalOrders += orders;
      totalGross += gross;
      totalTax += tax;
      totalNet += net;

      return {
        period: row.period,
        orders,
        gross,
        tax,
        net,
      };
    });

    return c.json({
      success: true,
      message: 'Income report retrieved successfully',
      data: {
        summary: {
          total_orders: totalOrders,
          gross_income: totalGross,
          tax_collected: totalTax,
          net_income: totalNet,
        },
        breakdown,
        period,
      },
    });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to fetch income report',
      error: (err as Error).message,
    }, 500);
  }
}
