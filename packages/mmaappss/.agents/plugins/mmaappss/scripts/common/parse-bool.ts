/**
 * Parse string to boolean. Returns defaultValue when value is undefined or empty.
 * Accepts 'true', '1' (case-insensitive) as truthy.
 *
 * @param value - String to parse (e.g. from process.env)
 * @param defaultValue - Value to return when undefined or empty
 */
export function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}
