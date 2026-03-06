import { describe, expect, it } from 'vitest';
import { parseBool } from './parse-bool.js';

describe('parseBool', () => {
  it('returns true for "true" (case-insensitive)', () => {
    expect(parseBool('true', false)).toBe(true);
    expect(parseBool('True', false)).toBe(true);
    expect(parseBool('TRUE', false)).toBe(true);
  });

  it('returns true for "1"', () => {
    expect(parseBool('1', false)).toBe(true);
  });

  it('returns false for "false" and other non-truthy strings', () => {
    expect(parseBool('false', true)).toBe(false);
    expect(parseBool('0', true)).toBe(false);
    expect(parseBool('no', true)).toBe(false);
  });

  it('returns defaultValue when undefined', () => {
    expect(parseBool(undefined, true)).toBe(true);
    expect(parseBool(undefined, false)).toBe(false);
  });

  it('returns defaultValue when empty string', () => {
    expect(parseBool('', true)).toBe(true);
    expect(parseBool('', false)).toBe(false);
  });
});
