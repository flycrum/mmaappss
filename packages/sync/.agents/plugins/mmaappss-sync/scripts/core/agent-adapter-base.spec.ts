import { ok, type Result } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import { pathHelpers } from '../common/path-helpers.js';
import { AgentAdapterBase } from './agent-adapter-base.js';
import type { DefinedAgent } from './marketplaces-config.js';
import { SyncModeBase, type SyncModeContext } from './sync-modes/sync-mode-base.js';

class RecordingSyncMode extends SyncModeBase {
  constructor(
    options?: unknown,
    private readonly calls: string[] = []
  ) {
    super(options);
  }

  override syncSetupBefore(): Result<void, Error> {
    this.calls.push('syncMode.syncSetupBefore');
    return ok(undefined);
  }

  override syncRunEnabled(): Result<void, Error> {
    this.calls.push('syncMode.syncRunEnabled');
    return ok(undefined);
  }

  override syncRunDisabled(): Result<void, Error> {
    this.calls.push('syncMode.syncRunDisabled');
    return ok(undefined);
  }

  override clearRun(): Result<void, Error> {
    this.calls.push('syncMode.clearRun');
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

  override syncSetupBefore(_context: SyncModeContext): Result<void, Error> {
    this.calls.push('adapter.syncSetupBefore');
    return ok(undefined);
  }

  override syncRunEnabled(_context: SyncModeContext): Result<void, Error> {
    this.calls.push('adapter.syncRunEnabled');
    return ok(undefined);
  }

  override syncRunDisabled(_context: SyncModeContext): Result<void, Error> {
    this.calls.push('adapter.syncRunDisabled');
    return ok(undefined);
  }

  override clearRunBefore(_context: SyncModeContext): Result<void, Error> {
    this.calls.push('adapter.clearRunBefore');
    return ok(undefined);
  }
}

describe('AgentAdapterBase lifecycle orchestration', () => {
  it('runs enabled sync hook chain and sync mode enabled hook', () => {
    const calls: string[] = [];
    class RecordingSyncModeClass extends RecordingSyncMode {
      constructor(options?: unknown) {
        super(options, calls);
      }
    }
    const adapter = new HookedAdapter(
      {
        name: 'claude',
        syncModes: [{ modeClass: RecordingSyncModeClass }],
      },
      calls
    );

    const result = adapter.run(pathHelpers.repoRoot, {
      marketplacesEnabled: {
        claude: true,
      },
    });
    expect(result.isOk()).toBe(true);
    expect(calls).toContain('adapter.syncSetupBefore');
    expect(calls).toContain('adapter.syncRunEnabled');
    expect(calls).toContain('syncMode.syncSetupBefore');
    expect(calls).toContain('syncMode.syncRunEnabled');
    expect(calls).not.toContain('syncMode.syncRunDisabled');
  });

  it('runs disabled sync hook chain and sync mode disabled hook', () => {
    const calls: string[] = [];
    class RecordingSyncModeClass extends RecordingSyncMode {
      constructor(options?: unknown) {
        super(options, calls);
      }
    }
    const adapter = new HookedAdapter(
      {
        name: 'claude',
        syncModes: [{ modeClass: RecordingSyncModeClass }],
      },
      calls
    );

    const result = adapter.run(pathHelpers.repoRoot, {
      marketplacesEnabled: {
        claude: false,
      },
    });
    expect(result.isOk()).toBe(true);
    expect(calls).toContain('adapter.syncRunDisabled');
    expect(calls).toContain('syncMode.syncRunDisabled');
    expect(calls).not.toContain('syncMode.syncRunEnabled');
  });

  it('runs clear lifecycle hooks and sync mode clear hook', () => {
    const calls: string[] = [];
    class RecordingSyncModeClass extends RecordingSyncMode {
      constructor(options?: unknown) {
        super(options, calls);
      }
    }
    const adapter = new HookedAdapter(
      {
        name: 'cursor',
        syncModes: [{ modeClass: RecordingSyncModeClass }],
      },
      calls
    );
    const result = adapter.clear(pathHelpers.repoRoot, null);
    expect(result.isOk()).toBe(true);
    expect(calls).toContain('adapter.clearRunBefore');
    expect(calls).toContain('syncMode.clearRun');
  });
});
