// Independent test-only TLV reader; not used by the generator.
export function readPixFields(payload: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let offset = 0;
  while (offset < payload.length) {
    const tag = payload.slice(offset, offset + 2);
    const size = payload.slice(offset + 2, offset + 4);
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(size)) throw new Error('Invalid TLV header');
    const end = offset + 4 + Number(size);
    if (end > payload.length || tag in fields) throw new Error('Invalid TLV length or duplicate tag');
    fields[tag] = payload.slice(offset + 4, end);
    offset = end;
  }
  return fields;
}