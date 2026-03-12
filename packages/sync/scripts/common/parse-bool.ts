/**
 * Parse string to boolean. Returns defaultValue when value is undefined, null, or empty (after trim).
 * Accepts 'true', 'yes', '1' (case-insensitive, trimmed) as truthy.
 *
 * @param value - String to parse (e.g. from process.env)
 * @param defaultValue - Value to return when undefined, null, or empty
 */
export function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null || value === '') return defaultValue;
  const lower = value.trim().toLowerCase();
  if (lower === '') return defaultValue;
  return lower === 'true' || lower === 'yes' || lower === '1';
}
