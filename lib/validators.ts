export function assertNonEmpty(value: string | undefined | null, label: string) {
  if (!value || !value.trim()) {
    throw new Error(`${label} wajib diisi`);
  }
}

export function assertPositiveInt(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} harus lebih dari 0`);
  }
  if (!Number.isFinite(value) || value > Number.MAX_SAFE_INTEGER) {
    throw new Error(`${label} melebihi batas angka valid`);
  }
}

export function assertPositiveInt32(value: number, label: string) {
  assertPositiveInt(value, label);
  if (value > 2_147_483_647) {
    throw new Error(`${label} maksimal 2.147.483.647`);
  }
}

export function assertNonNegativeInt(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} tidak valid`);
  }
  if (!Number.isFinite(value) || value > Number.MAX_SAFE_INTEGER) {
    throw new Error(`${label} melebihi batas angka valid`);
  }
}

export function assertValidDate(value: string | undefined, label: string) {
  if (!value) return;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} tidak valid`);
  }
}
