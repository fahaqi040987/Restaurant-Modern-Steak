// Effective table status shared by all table-reporting endpoints.
//
// `dining_tables.status` is the MANUAL state set by staff (available /
// reserved / maintenance) while `is_occupied` is order-driven. The two are
// combined here so every surface (admin tables page, server station, QR
// lookup) reports the same thing, with a reason:
//   maintenance > reserved > occupied > available

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export const TABLE_STATUSES = ['available', 'reserved', 'maintenance'] as const;

export const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'served'];

export function computeTableStatus(isOccupied: boolean | null, manualStatus: string | null): TableStatus {
  if (manualStatus === 'maintenance') return 'maintenance';
  if (manualStatus === 'reserved') return 'reserved';
  return isOccupied ? 'occupied' : 'available';
}
