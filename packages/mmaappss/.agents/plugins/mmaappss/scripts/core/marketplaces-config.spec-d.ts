/**
 * Type tests for marketplaces config: Exact constraint (type-fest), object and callback forms.
 * See [Vitest testing types](https://vitest.dev/guide/testing-types).
 */

import type { Exact } from 'type-fest';
import { expectTypeOf, test } from 'vitest';
import {
  marketplacesConfig,
  type MarketplacesConfig,
  type MarketplacesEnabledConfig,
} from './marketplaces-config.js';

// ---- type-fest Exact<ParameterType, InputType> ----
test('Exact rejects excess keys (parameter position)', () => {
  type Allowed = { a?: number };
  function accept<T extends Exact<Allowed, T>>(config: T): T {
    return config;
  }
  accept({ a: 1 });
  // @ts-expect-error - excess key 'bad' not in Allowed
  accept({ a: 1, bad: 2 });
});

// ---- defineMarketplacesConfig object form: valid config ----
test('defineMarketplacesConfig object form accepts valid config', () => {
  const config = marketplacesConfig.defineMarketplacesConfig({
    marketplacesEnabled: { claude: true, cursor: true, codex: true },
    excluded: ['.cursor/foo.md'],
  });
  expectTypeOf(config).toMatchTypeOf<MarketplacesConfig>();
  expectTypeOf(config).toHaveProperty('marketplacesEnabled');
  expectTypeOf(config).toHaveProperty('excluded');
});

test('defineMarketplacesConfig object form return has marketplacesEnabled shape', () => {
  const config = marketplacesConfig.defineMarketplacesConfig({
    marketplacesEnabled: { claude: true },
    excluded: [],
  });
  expectTypeOf(config.marketplacesEnabled).toMatchTypeOf<MarketplacesEnabledConfig | undefined>();
});

// ---- defineMarketplacesConfig object form: excess property must error ----
test('defineMarketplacesConfig object form rejects excess property', () => {
  marketplacesConfig.defineMarketplacesConfig({
    // @ts-expect-error - excess property marketplacesEnabledBadName not in MarketplacesConfig
    marketplacesEnabledBadName: { claude: true },
    excluded: [],
  });
});

// ---- defineMarketplacesConfig creator (no-arg callback): () => ({ ... }) ----
test('defineMarketplacesConfig creator form accepts valid config', () => {
  const config = marketplacesConfig.defineMarketplacesConfig(() => ({
    marketplacesEnabled: { claude: true, cursor: true },
    excluded: [],
  }));
  expectTypeOf(config).toMatchTypeOf<MarketplacesConfig>();
  expectTypeOf(config).toHaveProperty('marketplacesEnabled');
});

test('defineMarketplacesConfig creator form rejects excess property in return object', () => {
  // TReturn extends Exact<MarketplacesConfig, TReturn> must force this to error (negative test).
  // @ts-expect-error - creator return has excess property marketplacesEnabledBadName not in MarketplacesConfig
  marketplacesConfig.defineMarketplacesConfig(() => ({
    marketplacesEnabledBadName: {
      claude: true,
      cursor: true,
      codex: true,
    },
    excluded: ['.cursor/commands/git/git-pr-fillout-template.md'],
  }));
});

// ---- defineMarketplacesConfig callback form: (helpers, config) => config({ ... }) ----
test('defineMarketplacesConfig callback form accepts valid config', () => {
  const config = marketplacesConfig.defineMarketplacesConfig((helpers, config) =>
    config({
      marketplacesEnabled: { claude: true, cursor: true },
      excluded: [],
    })
  );
  expectTypeOf(config).toMatchTypeOf<MarketplacesConfig>();
  expectTypeOf(config).toHaveProperty('marketplacesEnabled');
});

test('defineMarketplacesConfig callback form rejects excess property when using config()', () => {
  marketplacesConfig.defineMarketplacesConfig((helpers, config) =>
    config({
      // @ts-expect-error - excess property marketplacesEnabledBadName not in MarketplacesConfig
      marketplacesEnabledBadName: { claude: true },
      excluded: [],
    })
  );
});
