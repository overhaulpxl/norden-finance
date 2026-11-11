import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeActionError, safeRevalidatePath } from '../lib/actionErrors';

describe('Server Action Error Sanitization', () => {
  it('masks raw Prisma database error codes and internals', () => {
    const prismaError = new Error('Invalid `prisma.user.create()` invocation: Unique constraint failed on the fields: (`email`) (P2002)');
    const sanitized = sanitizeActionError(prismaError);
    assert.equal(sanitized, 'Terjadi gangguan pada sistem database. Silakan coba kembali.');
  });

  it('masks database connection timeouts with friendly message', () => {
    const timeoutError = new Error('PrismaClientInitializationError: Timed out fetching a new connection from the connection pool (P2024)');
    const sanitized = sanitizeActionError(timeoutError);
    assert.equal(sanitized, 'Batas waktu pemrosesan database terlampaui. Silakan coba kembali.');
  });

  it('preserves user-facing domain validation errors', () => {
    const validationError = new Error('Nominal harus lebih dari 0');
    const sanitized = sanitizeActionError(validationError);
    assert.equal(sanitized, 'Nominal harus lebih dari 0');
  });

  it('preserves auth requirement errors', () => {
    const authError = new Error('Anda harus login terlebih dahulu.');
    const sanitized = sanitizeActionError(authError);
    assert.equal(sanitized, 'Anda harus login terlebih dahulu.');
  });

  it('preserves maintenance mode notifications', () => {
    const maintenanceError = new Error('MAINTENANCE_ACTIVE: Sistem dalam mode pemeliharaan.');
    const sanitized = sanitizeActionError(maintenanceError);
    assert.equal(sanitized, 'Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.');
  });

  it('falls back safely for unknown/arbitrary exceptions', () => {
    const unknownError = new Error('Uncaught reference to internal undefined pointer in module C');
    const sanitized = sanitizeActionError(unknownError, 'Custom fallback message');
    assert.equal(sanitized, 'Custom fallback message');
  });

  it('safeRevalidatePath does not throw outside of request context', () => {
    assert.doesNotThrow(() => {
      safeRevalidatePath('/dashboard');
      safeRevalidatePath('/settings');
    });
  });
});
