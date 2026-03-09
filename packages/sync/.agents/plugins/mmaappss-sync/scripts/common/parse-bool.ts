/**
 * Parse string to boolean. Returns defaultValue when value is undefined or empty.
 * Accepts 'true', 'yes', '1' (case-insensitive for words) as truthy.
 *
 * @param value - String to parse (e.g. from process.env)
 * @param defaultValue - Value to return when undefined or empty
 */
export function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue;
  const lower = value.toLowerCase();
  return lower === 'true' || lower === 'yes' || value === '1';
}
