import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configHelpers } from './config-helpers.js';

const { VARS } = configHelpers.env;
const ROOT = '/fake/root';

describe('configHelpers.general.getMarketplaceEnabled', () => {
  beforeEach(() => {
    vi.stubEnv(VARS.ENV_ALL, '');
    vi.stubEnv(VARS.ENV_CLAUDE, '');
    vi.stubEnv(VARS.ENV_CURSOR, '');
    vi.stubEnv(VARS.ENV_CODEX, '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns true when tsConfig has marketplaceClaude true and no env override', () => {
    expect(
      configHelpers.general.getMarketplaceEnabled(ROOT, { marketplaceClaude: true }, 'claude')
    ).toBe(true);
  });

  it('returns false when tsConfig has marketplaceClaude false and no env override', () => {
    expect(
      configHelpers.general.getMarketplaceEnabled(ROOT, { marketplaceClaude: false }, 'claude')
    ).toBe(false);
  });

  it('returns false when tsConfig null and no env', () => {
    expect(configHelpers.general.getMarketplaceEnabled(ROOT, null, 'claude')).toBe(false);
  });

  it('env overrides tsConfig: ENV_CLAUDE=true wins over marketplaceClaude: false', () => {
    vi.stubEnv(VARS.ENV_CLAUDE, 'true');
    expect(
      configHelpers.general.getMarketplaceEnabled(ROOT, { marketplaceClaude: false }, 'claude')
    ).toBe(true);
  });

  it('env overrides tsConfig: ENV_CLAUDE=false wins over marketplaceClaude: true', () => {
    vi.stubEnv(VARS.ENV_CLAUDE, 'false');
    expect(
      configHelpers.general.getMarketplaceEnabled(ROOT, { marketplaceClaude: true }, 'claude')
    ).toBe(false);
  });

  it('ENV_ALL=false disables all agents regardless of per-agent', () => {
    vi.stubEnv(VARS.ENV_ALL, 'false');
    vi.stubEnv(VARS.ENV_CLAUDE, 'true');
    expect(
      configHelpers.general.getMarketplaceEnabled(ROOT, { marketplaceClaude: true }, 'claude')
    ).toBe(false);
  });

  it('ENV_ALL=true with per-agent env: both must be true', () => {
    vi.stubEnv(VARS.ENV_ALL, 'true');
    vi.stubEnv(VARS.ENV_CLAUDE, 'false');
    expect(
      configHelpers.general.getMarketplaceEnabled(ROOT, { marketplaceClaude: true }, 'claude')
    ).toBe(false);
  });

  it('falls back to marketplaceAll when per-agent tsConfig unset', () => {
    expect(
      configHelpers.general.getMarketplaceEnabled(ROOT, { marketplaceAll: true }, 'claude')
    ).toBe(true);
    expect(
      configHelpers.general.getMarketplaceEnabled(ROOT, { marketplaceAll: false }, 'claude')
    ).toBe(false);
  });

  it('per-agent tsConfig overrides marketplaceAll', () => {
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        {
          marketplaceAll: false,
          marketplaceClaude: true,
        },
        'claude'
      )
    ).toBe(true);
  });

  it('works for cursor and codex agents', () => {
    vi.stubEnv(VARS.ENV_CURSOR, 'true');
    vi.stubEnv(VARS.ENV_CODEX, 'true');
    expect(configHelpers.general.getMarketplaceEnabled(ROOT, null, 'cursor')).toBe(true);
    expect(configHelpers.general.getMarketplaceEnabled(ROOT, null, 'codex')).toBe(true);
  });
});
