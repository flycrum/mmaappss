/**
 * Type tests for marketplaces config: Exact constraint (type-fest), object and callback forms.
 * See [Vitest testing types](https://vitest.dev/guide/testing-types).
 */

import type { Exact } from 'type-fest';
import { expectTypeOf, test } from 'vitest';
import {
  marketplacesConfig,
  type AgentsConfig,
  type MarketplacesConfig,
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
    agentsConfig: { claude: true, cursor: true, codex: true },
    excluded: ['.cursor/foo.md'],
  });
  expectTypeOf(config).toMatchTypeOf<MarketplacesConfig>();
  expectTypeOf(config).toHaveProperty('agentsConfig');
  expectTypeOf(config).toHaveProperty('excluded');
});

test('defineMarketplacesConfig object form return has agentsConfig shape', () => {
  const config = marketplacesConfig.defineMarketplacesConfig({
    agentsConfig: { claude: true },
    excluded: [],
  });
  expectTypeOf(config.agentsConfig).toMatchTypeOf<AgentsConfig | undefined>();
});

// ---- defineMarketplacesConfig object form: excess property must error ----
test('defineMarketplacesConfig object form rejects excess property', () => {
  marketplacesConfig.defineMarketplacesConfig({
    // @ts-expect-error - excess property agentsConfigBadName not in MarketplacesConfig
    agentsConfigBadName: { claude: true },
    excluded: [],
  });
});

// ---- defineMarketplacesConfig creator (no-arg callback): () => ({ ... }) ----
test('defineMarketplacesConfig creator form accepts valid config', () => {
  const config = marketplacesConfig.defineMarketplacesConfig(() => ({
    agentsConfig: { claude: true, cursor: true },
    excluded: [],
  }));
  expectTypeOf(config).toMatchTypeOf<MarketplacesConfig>();
  expectTypeOf(config).toHaveProperty('agentsConfig');
});

test('defineMarketplacesConfig creator form rejects excess property in return object', () => {
  // TReturn extends Exact<MarketplacesConfig, TReturn> must force this to error (negative test).
  // @ts-expect-error - creator return has excess property agentsConfigBadName not in MarketplacesConfig
  marketplacesConfig.defineMarketplacesConfig(() => ({
    agentsConfigBadName: {
      claude: true,
      cursor: true,
      codex: true,
    },
    excluded: ['.cursor/commands/git/git-pr-fillout-template.md'],
  }));
});

test('defineMarketplacesConfig callback form accepts valid config', () => {
  const config = marketplacesConfig.defineMarketplacesConfig((helpers) =>
    helpers.config({
      agentsConfig: { claude: true, cursor: true },
      excluded: [],
    })
  );
  expectTypeOf(config).toMatchTypeOf<MarketplacesConfig>();
  expectTypeOf(config).toHaveProperty('agentsConfig');
});

test('defineMarketplacesConfig callback form rejects excess property when using config()', () => {
  marketplacesConfig.defineMarketplacesConfig((helpers) =>
    helpers.config({
      // @ts-expect-error - excess property agentsConfigBadName not in MarketplacesConfig
      agentsConfigBadName: { claude: true },
      excluded: [],
    })
  );
});
