/**
 * Global Maintenance & Write-Freeze Guard for Norden Finance.
 *
 * Enforces zero-write quarantine across:
 * - User Server Actions
 * - Admin Server Actions
 * - Recurring transactions & crons
 * - File uploads
 * - Automated background tasks
 */

export const WRITE_OPERATIONS = new Set([
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
  'executeRaw',
  'queryRawUnsafe',
]);

/**
 * Returns true if maintenance mode / write-freeze is active.
 * Checked via environment variable for zero-latency, zero-DB-hit fail-closed protection.
 */
export function isMaintenanceMode(): boolean {
  return (
    process.env.MAINTENANCE_MODE === 'true' ||
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'
  );
}

/**
 * Explicit assertion guard for server actions and API handlers.
 * Throws a sanitized error when maintenance mode is active.
 */
export function assertWritesAllowed(context?: string): void {
  if (isMaintenanceMode()) {
    throw new Error(
      `MAINTENANCE_ACTIVE: Sistem dalam mode pemeliharaan (write-freeze active${
        context ? ` for ${context}` : ''
      }). Seluruh operasi tulis dibekukan sementara untuk menjaga konsistensi data.`
    );
  }
}
