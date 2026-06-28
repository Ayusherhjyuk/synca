export function toBuffer(value: unknown): Buffer {
  if (value == null) return Buffer.alloc(0);
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);

  const v = value as { buffer?: unknown; value?: (asRaw?: boolean) => unknown };
  if (v.buffer instanceof Uint8Array || Buffer.isBuffer(v.buffer)) {
    return Buffer.from(v.buffer as Uint8Array);
  }
  if (typeof v.value === "function") {
    return Buffer.from(v.value(true) as Uint8Array);
  }
  return Buffer.from(value as Uint8Array);
}

export function toBytes(value: unknown): Uint8Array {
  return new Uint8Array(toBuffer(value));
}
