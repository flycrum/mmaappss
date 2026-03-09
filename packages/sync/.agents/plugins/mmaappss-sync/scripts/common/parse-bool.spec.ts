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

  it('returns true for "yes" (case-insensitive)', () => {
    expect(parseBool('yes', false)).toBe(true);
    expect(parseBool('Yes', false)).toBe(true);
    expect(parseBool('YES', false)).toBe(true);
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

  it('does not trim: strings with surrounding whitespace do not match and return false', () => {
    expect(parseBool(' true ', false)).toBe(false);
    expect(parseBool(' true ', true)).toBe(false);
    expect(parseBool(' 1 ', false)).toBe(false);
    expect(parseBool(' 1 ', true)).toBe(false);
  });

  it('returns false for arbitrary non-boolean strings (not defaultValue)', () => {
    expect(parseBool('foo', true)).toBe(false);
    expect(parseBool('foo', false)).toBe(false);
  });

  it('throws when value is null at runtime (e.g. from JSON)', () => {
    expect(() => parseBool(null as unknown as string | undefined, true)).toThrow(TypeError);
    expect(() => parseBool(null as unknown as string | undefined, true)).toThrow(/toLowerCase/);
  });
});
