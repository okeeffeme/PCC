import { z } from "zod";
import { DeviceSortSchema, SortOrderSchema } from "./schemas/device";

/**
 * The cursor records everything the server needs to continue a keyset scan:
 * the sort, the filters it was issued under, and the last row returned. It is
 * opaque to clients — they pass the string back and the server decides whether
 * it is still valid (filters and sort must not have changed).
 */
const CursorPayloadSchema = z.object({
  v: z.literal(1),
  sort: DeviceSortSchema,
  order: SortOrderSchema,
  q: z.string(),
  status: z.string(),
  model: z.string(),
  key: z.string(),
  id: z.string(),
});

export type CursorPayload = z.infer<typeof CursorPayloadSchema>;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const LOOKUP = new Map<string, number>();
for (let index = 0; index < ALPHABET.length; index += 1) {
  LOOKUP.set(ALPHABET[index]!, index);
}

/**
 * UTF-8 → base64url without Buffer/btoa, so the exact same codec runs in the
 * server, the browser and the test double.
 */
function encodeBase64Url(bytes: Uint8Array): string {
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const byte1 = bytes[index]!;
    const byte2 = bytes[index + 1];
    const byte3 = bytes[index + 2];
    const triple = (byte1 << 16) | ((byte2 ?? 0) << 8) | (byte3 ?? 0);

    output += ALPHABET[(triple >> 18) & 63]!;
    output += ALPHABET[(triple >> 12) & 63]!;
    if (byte2 !== undefined) output += ALPHABET[(triple >> 6) & 63]!;
    if (byte3 !== undefined) output += ALPHABET[triple & 63]!;
  }
  return output;
}

function decodeBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;

  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 4) {
    const chunk = value.slice(index, index + 4);
    const numbers: Array<number | undefined> = [];
    for (let characterIndex = 0; characterIndex < chunk.length; characterIndex += 1) {
      numbers.push(LOOKUP.get(chunk[characterIndex]!));
    }
    if (numbers.some((number) => number === undefined)) return null;

    const [a, b, c, d] = numbers as number[];
    const triple = (a! << 18) | (b! << 12) | ((c ?? 0) << 6) | (d ?? 0);

    bytes.push((triple >> 16) & 255);
    if (c !== undefined) bytes.push((triple >> 8) & 255);
    if (d !== undefined) bytes.push(triple & 255);
  }
  return Uint8Array.from(bytes);
}

export function encodeCursor(payload: CursorPayload): string {
  return encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

export function decodeCursor(value: string): CursorPayload | null {
  try {
    const bytes = decodeBase64Url(value);
    if (!bytes) return null;
    const parsed = CursorPayloadSchema.safeParse(
      JSON.parse(new TextDecoder().decode(bytes)) as unknown,
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
