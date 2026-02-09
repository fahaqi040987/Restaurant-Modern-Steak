import type { Context } from 'hono';
import { eq, and, not, inArray, ilike, sql } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { diningTables, orders } from '../db/schema.js';
import { successResponse, errorResponse } from '../lib/response.js';

export async function getTables(c: Context) {
  const location = c.req.query('location');
  const occupiedOnly = c.req.query('occupied_only') === 'true';
  const availableOnly = c.req.query('available_only') === 'true';

  try {
    const conditions = [];

    if (location) {
      conditions.push(ilike(diningTables.location, `%${location}%`));
    }
    if (occupiedOnly) {
      conditions.push(eq(diningTables.isOccupied, true));
    } else if (availableOnly) {
      conditions.push(eq(diningTables.isOccupied, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: diningTables.id,
        tableNumber: diningTables.tableNumber,
        seatingCapacity: diningTables.seatingCapacity,
        location: diningTables.location,
        isOccupied: diningTables.isOccupied,
        qrCode: diningTables.qrCode,
        createdAt: diningTables.createdAt,
        updatedAt: diningTables.updatedAt,
      })
      .from(diningTables)
      .where(whereClause)
      .orderBy(diningTables.tableNumber);

    const data = rows.map((row) => ({
      id: row.id,
      table_number: row.tableNumber,
      seating_capacity: row.seatingCapacity,
      location: row.location,
      is_occupied: row.isOccupied,
      qr_code: row.qrCode,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
      current_order: null,
    }));

    return successResponse(c, 'Tables retrieved successfully', data);
  } catch (err) {
    return errorResponse(c, 'Failed to fetch tables', (err as Error).message);
  }
}

export async function getTable(c: Context) {
  const tableId = c.req.param('id');

  try {
    const [row] = await db
      .select({
        id: diningTables.id,
        tableNumber: diningTables.tableNumber,
        seatingCapacity: diningTables.seatingCapacity,
        location: diningTables.location,
        isOccupied: diningTables.isOccupied,
        qrCode: diningTables.qrCode,
        createdAt: diningTables.createdAt,
        updatedAt: diningTables.updatedAt,
      })
      .from(diningTables)
      .where(eq(diningTables.id, tableId))
      .limit(1);

    if (!row) {
      return errorResponse(c, 'Table not found', 'table_not_found', 404);
    }

    // Get current active order for this table
    let currentOrder: Record<string, unknown> | null = null;
    const [activeOrder] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        orderType: orders.orderType,
        status: orders.status,
        subtotal: orders.subtotal,
        taxAmount: orders.taxAmount,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(
        and(
          eq(orders.tableId, tableId),
          not(inArray(orders.status, ['completed', 'cancelled'])),
        ),
      )
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(1);

    if (activeOrder) {
      currentOrder = {
        id: activeOrder.id,
        order_number: activeOrder.orderNumber,
        customer_name: activeOrder.customerName,
        order_type: activeOrder.orderType,
        status: activeOrder.status,
        subtotal: Number(activeOrder.subtotal),
        tax_amount: Number(activeOrder.taxAmount),
        total_amount: Number(activeOrder.totalAmount),
        created_at: activeOrder.createdAt,
        updated_at: activeOrder.updatedAt,
      };
    }

    const response = {
      id: row.id,
      table_number: row.tableNumber,
      seating_capacity: row.seatingCapacity,
      location: row.location,
      is_occupied: row.isOccupied,
      qr_code: row.qrCode,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
      current_order: currentOrder,
    };

    return successResponse(c, 'Table retrieved successfully', response);
  } catch (err) {
    return errorResponse(c, 'Failed to fetch table', (err as Error).message);
  }
}

export async function getTablesByLocation(c: Context) {
  try {
    const rows = await db
      .select({
        id: diningTables.id,
        tableNumber: diningTables.tableNumber,
        seatingCapacity: diningTables.seatingCapacity,
        location: diningTables.location,
        isOccupied: diningTables.isOccupied,
        qrCode: diningTables.qrCode,
        createdAt: diningTables.createdAt,
        updatedAt: diningTables.updatedAt,
      })
      .from(diningTables)
      .orderBy(diningTables.location, diningTables.tableNumber);

    // Group tables by location
    const locationMap: Record<string, Record<string, unknown>[]> = {};

    for (const row of rows) {
      const loc = row.location || 'General';
      if (!locationMap[loc]) locationMap[loc] = [];
      locationMap[loc].push({
        id: row.id,
        table_number: row.tableNumber,
        seating_capacity: row.seatingCapacity,
        location: row.location,
        is_occupied: row.isOccupied,
        qr_code: row.qrCode,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
      });
    }

    const locations = Object.entries(locationMap).map(([locationName, tables]) => ({
      location: locationName,
      tables,
    }));

    return successResponse(c, 'Tables grouped by location retrieved successfully', locations);
  } catch (err) {
    return errorResponse(c, 'Failed to fetch tables', (err as Error).message);
  }
}

export async function getTableStatus(c: Context) {
  try {
    const rows = await db.execute<{
      total_tables: string;
      occupied_tables: string;
      available_tables: string;
      location: string;
    }>(sql`
      SELECT
        COUNT(*) as total_tables,
        COUNT(CASE WHEN is_occupied = true THEN 1 END) as occupied_tables,
        COUNT(CASE WHEN is_occupied = false THEN 1 END) as available_tables,
        COALESCE(location, 'General') as location
      FROM dining_tables
      GROUP BY COALESCE(location, 'General')
      ORDER BY location
    `);

    let totalTables = 0;
    let totalOccupied = 0;
    let totalAvailable = 0;

    const locationStats = rows.rows.map((row) => {
      const total = Number(row.total_tables);
      const occupied = Number(row.occupied_tables);
      const available = Number(row.available_tables);

      totalTables += total;
      totalOccupied += occupied;
      totalAvailable += available;

      return {
        location: row.location,
        total_tables: total,
        occupied_tables: occupied,
        available_tables: available,
        occupancy_rate: total > 0 ? (occupied / total) * 100 : 0,
      };
    });

    const response = {
      total_tables: totalTables,
      occupied_tables: totalOccupied,
      available_tables: totalAvailable,
      occupancy_rate: totalTables > 0 ? (totalOccupied / totalTables) * 100 : 0,
      by_location: locationStats,
    };

    return successResponse(c, 'Table status retrieved successfully', response);
  } catch (err) {
    return errorResponse(c, 'Failed to fetch table status', (err as Error).message);
  }
}
