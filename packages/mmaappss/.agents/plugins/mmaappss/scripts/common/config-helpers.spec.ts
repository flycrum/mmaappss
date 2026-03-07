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

  it('returns true when tsConfig has marketplacesEnabled.claude true and no env override', () => {
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        { marketplacesEnabled: { claude: true, cursor: false, codex: false } },
        'claude'
      )
    ).toBe(true);
  });

  it('returns false when tsConfig has marketplacesEnabled.claude false and no env override', () => {
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        { marketplacesEnabled: { claude: false, cursor: false, codex: false } },
        'claude'
      )
    ).toBe(false);
  });

  it('returns false when tsConfig null and no env', () => {
    expect(configHelpers.general.getMarketplaceEnabled(ROOT, null, 'claude')).toBe(false);
  });

  it('env overrides tsConfig: ENV_CLAUDE=true wins over marketplacesEnabled.claude: false', () => {
    vi.stubEnv(VARS.ENV_CLAUDE, 'true');
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        { marketplacesEnabled: { claude: false, cursor: false, codex: false } },
        'claude'
      )
    ).toBe(true);
  });

  it('env overrides tsConfig: ENV_CLAUDE=false wins over marketplacesEnabled.claude: true', () => {
    vi.stubEnv(VARS.ENV_CLAUDE, 'false');
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        { marketplacesEnabled: { claude: true, cursor: false, codex: false } },
        'claude'
      )
    ).toBe(false);
  });

  it('ENV_ALL=false disables all agents regardless of per-agent', () => {
    vi.stubEnv(VARS.ENV_ALL, 'false');
    vi.stubEnv(VARS.ENV_CLAUDE, 'true');
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        { marketplacesEnabled: { claude: true, cursor: false, codex: false } },
        'claude'
      )
    ).toBe(false);
  });

  it('ENV_ALL=true with per-agent env: both must be true', () => {
    vi.stubEnv(VARS.ENV_ALL, 'true');
    vi.stubEnv(VARS.ENV_CLAUDE, 'false');
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        { marketplacesEnabled: { claude: true, cursor: false, codex: false } },
        'claude'
      )
    ).toBe(false);
  });

  it("marketplacesEnabled: 'all' enables all agents", () => {
    expect(
      configHelpers.general.getMarketplaceEnabled(ROOT, { marketplacesEnabled: 'all' }, 'claude')
    ).toBe(true);
    expect(
      configHelpers.general.getMarketplaceEnabled(ROOT, { marketplacesEnabled: 'all' }, 'cursor')
    ).toBe(true);
    expect(
      configHelpers.general.getMarketplaceEnabled(ROOT, { marketplacesEnabled: 'all' }, 'codex')
    ).toBe(true);
  });

  it('marketplacesEnabled object: only specified agents enabled', () => {
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        { marketplacesEnabled: { claude: true, cursor: false, codex: false } },
        'claude'
      )
    ).toBe(true);
    expect(
      configHelpers.general.getMarketplaceEnabled(
        ROOT,
        { marketplacesEnabled: { claude: true, cursor: false, codex: false } },
        'cursor'
      )
    ).toBe(false);
  });

  it('works for cursor and codex agents via env', () => {
    vi.stubEnv(VARS.ENV_CURSOR, 'true');
    vi.stubEnv(VARS.ENV_CODEX, 'true');
    expect(configHelpers.general.getMarketplaceEnabled(ROOT, null, 'cursor')).toBe(true);
    expect(configHelpers.general.getMarketplaceEnabled(ROOT, null, 'codex')).toBe(true);
  });
});

describe('configHelpers.general.getLoggingEnabled', () => {
  const ENV_LOGGING = configHelpers.env.VARS.ENV_LOGGING;

  beforeEach(() => {
    vi.stubEnv(ENV_LOGGING, '');
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

  it('env overrides tsConfig: ENV_LOGGING=true wins over loggingEnabled: false', () => {
    vi.stubEnv(ENV_LOGGING, 'true');
    expect(configHelpers.general.getLoggingEnabled(ROOT, { loggingEnabled: false })).toBe(true);
  });

  it('env overrides tsConfig: ENV_LOGGING=false wins over loggingEnabled: true', () => {
    vi.stubEnv(ENV_LOGGING, 'false');
    expect(configHelpers.general.getLoggingEnabled(ROOT, { loggingEnabled: true })).toBe(false);
  });
});
