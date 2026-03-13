import { describe, expect, it } from 'vitest';
import { presetPathHelpers } from './preset-path-helpers.js';

describe('presetPathHelpers.joinSegments', () => {
  it('joins two segments without double slash', () => {
    expect(presetPathHelpers.joinSegments('.agents/', 'plugins')).toBe('.agents/plugins');
    expect(presetPathHelpers.joinSegments('.agents', 'plugins/')).toBe('.agents/plugins');
    expect(presetPathHelpers.joinSegments('.agents/', 'plugins/')).toBe('.agents/plugins');
  });

  it('joins without missing slash', () => {
    expect(presetPathHelpers.joinSegments('.agents', 'plugins')).toBe('.agents/plugins');
  });

  it('handles empty first segment', () => {
    expect(presetPathHelpers.joinSegments('', 'plugins')).toBe('plugins');
  });

  it('handles empty second segment', () => {
    expect(presetPathHelpers.joinSegments('.agents', '')).toBe('.agents');
  });

  it('normalizes backslashes to forward slashes', () => {
    expect(presetPathHelpers.joinSegments('.agents\\', 'plugins')).toBe('.agents/plugins');
  });
});
