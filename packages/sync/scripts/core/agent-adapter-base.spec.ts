import { ok, type Result } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import { pathHelpers } from '../common/path-helpers.js';
import { AgentAdapterBase } from './agent-adapter-base.js';
import type { DefinedAgent } from './marketplaces-config.js';
import { SyncBehaviorBase, type SyncBehaviorContext } from './sync-behaviors/sync-behavior-base.js';

class RecordingSyncBehavior extends SyncBehaviorBase {
  constructor(
    options: unknown | undefined,
    private readonly calls: string[]
  ) {
    super(options);
  }

  override syncSetupBefore(): Result<void, Error> {
    this.calls.push('syncBehavior.syncSetupBefore');
    return ok(undefined);
  }

  override syncRunEnabled(): Result<void, Error> {
    this.calls.push('syncBehavior.syncRunEnabled');
    return ok(undefined);
  }

  override syncRunDisabled(): Result<void, Error> {
    this.calls.push('syncBehavior.syncRunDisabled');
    return ok(undefined);
  }

  override clearRun(): Result<void, Error> {
    this.calls.push('syncBehavior.clearRun');
    return ok(undefined);
  }
}

class HookedAdapter extends AgentAdapterBase {
  constructor(
    agentConfig: DefinedAgent,
    private readonly calls: string[]
  ) {
    super(agentConfig);
  }

  override syncSetupBefore(_context: SyncBehaviorContext): Result<void, Error> {
    this.calls.push('adapter.syncSetupBefore');
    return ok(undefined);
  }

  override syncRunEnabled(_context: SyncBehaviorContext): Result<void, Error> {
    this.calls.push('adapter.syncRunEnabled');
    return ok(undefined);
  }

  override syncRunDisabled(_context: SyncBehaviorContext): Result<void, Error> {
    this.calls.push('adapter.syncRunDisabled');
    return ok(undefined);
  }

  override clearRunBefore(_context: SyncBehaviorContext): Result<void, Error> {
    this.calls.push('adapter.clearRunBefore');
    return ok(undefined);
  }
}

describe('AgentAdapterBase lifecycle orchestration', () => {
  it('runs enabled sync hook chain and sync behavior enabled hook', () => {
    const calls: string[] = [];
    class RecordingSyncBehaviorClass extends RecordingSyncBehavior {
      constructor(options?: unknown) {
        super(options, calls);
      }
    }
    const adapter = new HookedAdapter(
      {
        name: 'claude',
        syncBehaviors: [{ behaviorClass: RecordingSyncBehaviorClass }],
      },
      calls
    );

    const result = adapter.run(pathHelpers.repoRoot, {
      agentsConfig: {
        claude: true,
      },
    });
    expect(result.isOk()).toBe(true);
    const expectedCalls = [
      'adapter.syncSetupBefore',
      'syncBehavior.syncSetupBefore',
      'adapter.syncRunEnabled',
      'syncBehavior.syncRunEnabled',
    ];
    expect(calls).toEqual(expectedCalls);
  });

  it('runs disabled sync hook chain and sync behavior disabled hook', () => {
    const calls: string[] = [];
    class RecordingSyncBehaviorClass extends RecordingSyncBehavior {
      constructor(options?: unknown) {
        super(options, calls);
      }
    }
    const adapter = new HookedAdapter(
      {
        name: 'claude',
        syncBehaviors: [{ behaviorClass: RecordingSyncBehaviorClass }],
      },
      calls
    );

    const result = adapter.run(pathHelpers.repoRoot, {
      agentsConfig: {
        claude: false,
      },
    });
    expect(result.isOk()).toBe(true);
    expect(calls).toContain('adapter.syncRunDisabled');
    expect(calls).toContain('syncBehavior.syncRunDisabled');
    expect(calls).not.toContain('syncBehavior.syncRunEnabled');
    expect(calls).not.toContain('adapter.syncRunEnabled');
  });

  it('runs clear lifecycle hooks and sync behavior clear hook', () => {
    const calls: string[] = [];
    class RecordingSyncBehaviorClass extends RecordingSyncBehavior {
      constructor(options?: unknown) {
        super(options, calls);
      }
    }
    const adapter = new HookedAdapter(
      {
        name: 'cursor',
        syncBehaviors: [{ behaviorClass: RecordingSyncBehaviorClass }],
      },
      calls
    );
    const result = adapter.clear(pathHelpers.repoRoot, null);
    expect(result.isOk()).toBe(true);
    expect(calls).toContain('adapter.clearRunBefore');
    expect(calls).toContain('syncBehavior.clearRun');
  });
});
