/**
 * Global Maintenance & Write-Freeze Guard for Norden Finance.
 *
 * Enforces zero-write quarantine across:
 * - User Server Actions
 * - Admin Server Actions
 * - Recurring transactions & crons
 * - File uploads
 * - Automated background tasks
 * - Raw SQL mutations ($executeRaw, $executeRawUnsafe, $queryRaw with DML)
 * - Interactive and batch transactions
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

/**
 * Assert that raw execution ($executeRaw / $executeRawUnsafe) is allowed.
 * Unconditionally blocks raw execution during maintenance mode.
 */
export function assertRawExecutionBlocked(operationName = '$executeRaw'): void {
  if (isMaintenanceMode()) {
    throw new Error(
      `MAINTENANCE_ACTIVE: Raw SQL execution (${operationName}) is blocked by system maintenance freeze.`
    );
  }
}

/**
 * Assert that a raw query ($queryRaw / $queryRawUnsafe) does not perform mutations.
 * Blocks any raw query containing DML/DDL (INSERT ... RETURNING, UPDATE, etc.) during maintenance.
 */
export function assertRawQueryAllowed(queryArgs: unknown): void {
  if (!isMaintenanceMode()) return;

  let sqlString = '';
  if (typeof queryArgs === 'string') {
    sqlString = queryArgs;
  } else if (queryArgs && typeof queryArgs === 'object') {
    const q = queryArgs as any;
    if (Array.isArray(q.strings)) {
      sqlString = q.strings.join(' ? ');
    } else if (typeof q.text === 'string') {
      sqlString = q.text;
    } else if (typeof q.sql === 'string') {
      sqlString = q.sql;
    } else {
      sqlString = String(queryArgs);
    }
  }

  // Strip block comments /* ... */ and line comments -- ...
  const sanitized = sqlString
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '')
    .trim();

  const upper = sanitized.toUpperCase();

  // If query is empty or does not start with SELECT or WITH, block it
  const isSelect = upper.startsWith('SELECT') || upper.startsWith('WITH');

  // Any mutating keyword in the query is blocked (preventing INSERT ... RETURNING, CTE mutation, etc.)
  const mutatingKeywords = [
    'INSERT ',
    'UPDATE ',
    'DELETE ',
    'DROP ',
    'ALTER ',
    'TRUNCATE ',
    'CREATE ',
    'RENAME ',
    'GRANT ',
    'REVOKE ',
  ];

  const containsMutation = mutatingKeywords.some((keyword) => upper.includes(keyword));

  if (!isSelect || containsMutation) {
    throw new Error(
      `MAINTENANCE_ACTIVE: Raw SQL query contains mutating statement or is not read-only. Blocked by maintenance freeze.`
    );
  }
}
