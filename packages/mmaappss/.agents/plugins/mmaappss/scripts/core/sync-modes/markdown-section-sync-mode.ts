import { ok, Result } from 'neverthrow';
import path from 'node:path';
import { markdownSection } from '../../common/markdown-section.js';
import { SyncModeBase, type SyncModeContext } from './sync-mode-base.js';

/** Options for syncing and removing a managed markdown section. */
export interface MarkdownSectionSyncModeOptions {
  /** Relative path to markdown file that owns the managed section. */
  agentsFile: string;
  /** Optional hook called before sync setup when custom pre-sync behavior is needed. */
  beforeSyncFn?: (context: SyncModeContext) => Result<void, Error>;
  /** Optional builder for section body content; defaults to marketplace/plugin list markdown. */
  buildSectionContentFn?: (context: SyncModeContext) => string;
  /** Optional list of section headings to remove before writing (when removeExistingSectionBlocks is true). */
  legacyHeadingsToRemove?: string[];
  /** When true, runs legacy cleanup: removes legacyHeadingsToRemove sections then removeOrphanBlocksFn if set. */
  removeExistingSectionBlocks?: boolean;
  /** Optional callback to remove orphan blocks (e.g. legacy ### blocks). Run after legacyHeadingsToRemove. */
  removeOrphanBlocksFn?: (filePath: string) => Result<void, Error>;
  /** Section heading text used for replace/remove operations. */
  sectionHeading: string;
}

export class MarkdownSectionSyncMode extends SyncModeBase<MarkdownSectionSyncModeOptions> {
  constructor(options?: MarkdownSectionSyncModeOptions) {
    super(options);
  }

  /** Removes the managed markdown section from target file. */
  private teardownMarkdownSection(context: SyncModeContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    const filePath = path.join(context.repoRoot, options.agentsFile);
    const heading = options.sectionHeading.replace(/^#+\s*/, '');
    return markdownSection.removeSection(filePath, heading);
  }

  /** Builds section markdown content using custom builder or default marketplace listing. */
  private buildMarkdownSectionContent(context: SyncModeContext): string {
    const options = this.options;
    if (!options) return '';
    if (options.buildSectionContentFn) return options.buildSectionContentFn(context);

    const lines: string[] = [];
    for (const marketplace of context.marketplaces) {
      if (marketplace.plugins.length === 0) continue;
      lines.push(`### \`${marketplace.relativePath}\` marketplace`, '');
      for (const plugin of marketplace.plugins) {
        lines.push(`- [${plugin.manifestName ?? plugin.name}](./${plugin.relativePath})`);
      }
      lines.push('');
    }
    return lines.join('\n').trim();
  }

  /** Sync setup hook that runs custom pre-sync logic or legacy cleanup. */
  override syncSetupBefore(context: SyncModeContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    if (options.beforeSyncFn) return options.beforeSyncFn(context);
    if (!options.removeExistingSectionBlocks) return ok(undefined);
    const filePath = path.join(context.repoRoot, options.agentsFile);
    let result: Result<void, Error> = ok(undefined);
    for (const heading of options.legacyHeadingsToRemove ?? []) {
      result = result.andThen(() =>
        markdownSection.removeSection(filePath, heading.replace(/^#+\s*/, ''))
      );
      if (result.isErr()) return result;
    }
    if (options.removeOrphanBlocksFn) {
      result = result.andThen(() => options.removeOrphanBlocksFn!(filePath));
    }
    return result;
  }

  /** Sync-phase enabled hook that writes or replaces the managed section content. */
  override syncRunEnabled(context: SyncModeContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    const filePath = path.join(context.repoRoot, options.agentsFile);
    const heading = options.sectionHeading.replace(/^#+\s*/, '');
    const content = this.buildMarkdownSectionContent(context);
    return markdownSection.replaceOrAddSection(filePath, heading, content);
  }

  /** Sync-phase disabled hook that removes the managed section. */
  override syncRunDisabled(context: SyncModeContext): Result<void, Error> {
    return this.teardownMarkdownSection(context);
  }

  /** Clear hook that removes the managed section. */
  override clearRun(context: SyncModeContext): Result<void, Error> {
    return this.teardownMarkdownSection(context);
  }
}
