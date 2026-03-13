import { describe, expect, it } from 'vitest';
import {
  getEffectiveBaseOptions,
  getResolvedPluginsPath,
  getResolvedSkillsPath,
} from './mmaappss-base-preset-options.js';

describe('getEffectiveBaseOptions', () => {
  it('returns defaults when override is null/undefined', () => {
    const opts = getEffectiveBaseOptions(null);
    expect(opts.AGENTS_SOURCE_DIR).toBe('.agents/');
    expect(opts.AGENTS_PLUGINS_DIR).toBe('plugins/');
    expect(opts.AGENTS_SKILLS_DIR).toBe('skills/');
    expect(opts.AGENT_MD_FILENAME).toBe('AGENTS.md');

    expect(getEffectiveBaseOptions(undefined)).toEqual(opts);
  });

  it('merges override with defaults', () => {
    const opts = getEffectiveBaseOptions({
      AGENTS_SOURCE_DIR: '.my-company/',
      AGENTS_PLUGINS_DIR: 'our-plugins',
    });
    expect(opts.AGENTS_SOURCE_DIR).toBe('.my-company/');
    expect(opts.AGENTS_PLUGINS_DIR).toBe('our-plugins');
    expect(opts.AGENTS_SKILLS_DIR).toBe('skills/');
  });
});

describe('getResolvedPluginsPath', () => {
  it('returns .agents/plugins with default options', () => {
    expect(getResolvedPluginsPath(null)).toBe('.agents/plugins');
  });

  it('uses override when provided', () => {
    expect(getResolvedPluginsPath({ AGENTS_SOURCE_DIR: '.foo/', AGENTS_PLUGINS_DIR: 'bar' })).toBe(
      '.foo/bar'
    );
  });
});

describe('getResolvedSkillsPath', () => {
  it('returns .agents/skills with default options', () => {
    expect(getResolvedSkillsPath(null)).toBe('.agents/skills');
  });

  it('uses override when provided', () => {
    expect(
      getResolvedSkillsPath({ AGENTS_SOURCE_DIR: '.foo/', AGENTS_SKILLS_DIR: 'our-skills' })
    ).toBe('.foo/our-skills');
  });
});
