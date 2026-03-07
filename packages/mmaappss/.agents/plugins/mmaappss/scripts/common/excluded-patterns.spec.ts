import { describe, expect, it } from 'vitest';
import { isExcluded } from './excluded-patterns.js';

describe('isExcluded', () => {
  it('returns false when patterns is undefined or empty', () => {
    expect(isExcluded('packages', undefined)).toBe(false);
    expect(isExcluded('packages', [])).toBe(false);
  });

  it('matches literal segment', () => {
    expect(isExcluded('packages', ['packages'])).toBe(true);
    expect(isExcluded('git', ['git'])).toBe(true);
    expect(isExcluded('packages', ['git'])).toBe(false);
  });

  it('matches literal path', () => {
    expect(isExcluded('.agents/plugins/git', ['.agents/plugins/git'])).toBe(true);
    expect(
      isExcluded('.cursor/commands/git/git-pr-fillout-template.md', [
        '.cursor/commands/git/git-pr-fillout-template.md',
      ])
    ).toBe(true);
    expect(isExcluded('.agents/plugins/mmaappss', ['.agents/plugins/git'])).toBe(false);
  });

  it('normalizes backslashes to forward slashes', () => {
    expect(isExcluded('.cursor\\commands\\git\\file.md', ['.cursor/commands/git/file.md'])).toBe(
      true
    );
    expect(isExcluded('.cursor/commands/git/file.md', ['.cursor\\commands\\git\\file.md'])).toBe(
      true
    );
  });

  it('matches glob patterns', () => {
    expect(isExcluded('packages/foo', ['packages/*'])).toBe(true);
    expect(isExcluded('file.md', ['*.md'])).toBe(true);
    expect(isExcluded('.cursor/commands/git/file.md', ['*.md'])).toBe(false); // * is one segment
    expect(isExcluded('.agents/plugins/git', ['.agents/plugins/*'])).toBe(true);
  });
});
