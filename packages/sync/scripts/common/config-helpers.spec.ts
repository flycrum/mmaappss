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

  it('returns true when config enables claude with boolean', () => {
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        { marketplacesEnabled: { claude: true } },
        'claude'
      )
    ).toBe(true);
  });

  it('returns false when config disables claude with boolean', () => {
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        { marketplacesEnabled: { claude: false } },
        'claude'
      )
    ).toBe(false);
  });

  it('returns false when tsConfig null and no env', () => {
    expect(configHelpers.general.getMarketplaceEnabled(ROOT, null, 'claude')).toBe(false);
  });

  it('when tsConfig present, env ignored: TS false wins', () => {
    vi.stubEnv(VARS.ENV_CLAUDE, 'true');
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        { marketplacesEnabled: { claude: false } },
        'claude'
      )
    ).toBe(false);
  });

  it('when tsConfig present, env ignored: TS true wins', () => {
    vi.stubEnv(VARS.ENV_CLAUDE, 'false');
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        { marketplacesEnabled: { claude: true } },
        'claude'
      )
    ).toBe(true);
  });

  it('when tsConfig present, ENV_ALL ignored', () => {
    vi.stubEnv(VARS.ENV_ALL, 'false');
    vi.stubEnv(VARS.ENV_CLAUDE, 'true');
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        { marketplacesEnabled: { claude: true } },
        'claude'
      )
    ).toBe(true);
  });

  it('when tsConfig present, per-agent env ignored', () => {
    vi.stubEnv(VARS.ENV_ALL, 'true');
    vi.stubEnv(VARS.ENV_CLAUDE, 'false');
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        { marketplacesEnabled: { claude: true } },
        'claude'
      )
    ).toBe(true);
  });

  it('when tsConfig null, env enables agent', () => {
    vi.stubEnv(VARS.ENV_CLAUDE, 'true');
    expect(configHelpers.general.getMarketplaceEnabled(ROOT, null, 'claude')).toBe(true);
  });

  it('preset agent object entry is treated as enabled', () => {
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        {
          marketplacesEnabled: {
            claude: {
              name: 'claude',
              syncBehaviorPresets: {},
            },
          },
        },
        'claude'
      )
    ).toBe(true);
  });

  it('custom agent entry is enabled via custom map', () => {
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        {
          marketplacesEnabled: {
            custom: {
              acme: {
                name: 'acme',
                syncBehaviorPresets: {},
              },
            },
          },
        },
        'acme'
      )
    ).toBe(true);
  });
});

describe('configHelpers.general.getLoggingEnabled', () => {
  beforeEach(() => {
    vi.stubEnv(VARS.ENV_LOGGING, '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns false when tsConfig null and no env', () => {
    expect(configHelpers.general.getLoggingEnabled(ROOT, null)).toBe(false);
  });

  it('returns true when tsConfig has loggingEnabled true', () => {
    expect(configHelpers.general.getLoggingEnabled(ROOT, { loggingEnabled: true })).toBe(true);
  });

  it('returns false when tsConfig has loggingEnabled false', () => {
    expect(configHelpers.general.getLoggingEnabled(ROOT, { loggingEnabled: false })).toBe(false);
  });

  it('when tsConfig present, env ignored: TS false wins', () => {
    vi.stubEnv(VARS.ENV_LOGGING, 'true');
    expect(configHelpers.general.getLoggingEnabled(ROOT, { loggingEnabled: false })).toBe(false);
  });

  it('when tsConfig present, env ignored: TS true wins', () => {
    vi.stubEnv(VARS.ENV_LOGGING, 'false');
    expect(configHelpers.general.getLoggingEnabled(ROOT, { loggingEnabled: true })).toBe(true);
  });

  it('when tsConfig null, env enables logging', () => {
    vi.stubEnv(VARS.ENV_LOGGING, 'true');
    expect(configHelpers.general.getLoggingEnabled(ROOT, null)).toBe(true);
  });
});

describe('configHelpers.general.getPostMergeSyncMarketplaces', () => {
  it('returns default when postMergeSyncMarketplaces missing or empty', () => {
    expect(configHelpers.general.getPostMergeSyncMarketplaces(ROOT, null)).toEqual([
      'claude',
      'cursor',
      'codex',
    ]);
    expect(
      configHelpers.general.getPostMergeSyncMarketplaces(ROOT, { postMergeSyncMarketplaces: [] })
    ).toEqual(['claude', 'cursor', 'codex']);
    expect(
      configHelpers.general.getPostMergeSyncMarketplaces(ROOT, { postMergeSyncMarketplaces: undefined })
    ).toEqual(['claude', 'cursor', 'codex']);
  });

  it('returns only preset names that are known (preset or enabled)', () => {
    expect(
      configHelpers.general.getPostMergeSyncMarketplaces(ROOT, {
        postMergeSyncMarketplaces: ['claude', 'cursor', 'codex'],
      })
    ).toEqual(['claude', 'cursor', 'codex']);
  });

  it('filters out unknown agent names and trims', () => {
    expect(
      configHelpers.general.getPostMergeSyncMarketplaces(ROOT, {
        postMergeSyncMarketplaces: ['claude', 'curor', '  cursor  ', 'codex'],
      })
    ).toEqual(['claude', 'cursor', 'codex']);
  });

  it('includes custom agent names from marketplacesEnabled', () => {
    expect(
      configHelpers.general.getPostMergeSyncMarketplaces(ROOT, {
        marketplacesEnabled: {
          custom: {
            acme: { name: 'acme', syncBehaviorPresets: {} },
          },
        },
        postMergeSyncMarketplaces: ['claude', 'acme'],
      })
    ).toEqual(['claude', 'acme']);
  });

  it('falls back to default when all entries are unknown', () => {
    expect(
      configHelpers.general.getPostMergeSyncMarketplaces(ROOT, {
        postMergeSyncMarketplaces: ['typo', 'unknown-agent'],
      })
    ).toEqual(['claude', 'cursor', 'codex']);
  });
});
