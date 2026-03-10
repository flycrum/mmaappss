import { err, ok, Result } from 'neverthrow';
import path from 'node:path';
import { isExcluded } from '../../common/excluded-patterns.js';
import { syncFs } from '../../common/sync-fs.js';
import type { PluginManifestKey } from '../../common/types.js';
import { SyncBehaviorBase, type SyncBehaviorContext } from './sync-behavior-base.js';

/** Rich metadata about one plugin top-level entry offered to transform callbacks. */
export interface LocalPluginContent {
  /** Absolute source path for the plugin entry. */
  absolutePath: string;
  /** Current agent name being synced. */
  agentName: string;
  /** File or directory name at plugin top-level. */
  entryName: string;
  /** File extension for file entries (empty string for directories). */
  extension: string;
  /** True when the entry is a directory. */
  isDirectory: boolean;
  /** True when the entry is a file. */
  isFile: boolean;
  /** Plugin directory name. */
  pluginName: string;
  /** Plugin path relative to repo root. */
  relativePluginPath: string;
  /** Default target path derived by the sync behavior before overrides. */
  targetPath: string;
  /** Original top-level entry name. */
  topLevelEntryName: string;
}

/** Optional overrides returned by `processPluginFolderOrFile`. */
export interface LocalPluginContentOverride {
  /** Replacement file contents written instead of source content. */
  fileContents?: string;
  /** Replacement filename used for target path construction. */
  filename?: string;
  /** Skip processing this entry when true. */
  skip?: boolean;
  /** Forces symlink behavior for this entry when true. */
  symlink?: boolean;
  /** Absolute or repo-relative target override path for this entry. */
  targetPath?: string;
}

/** Folder-level transform hooks for markdown content and filename mapping. */
export interface FolderTransformOptions {
  /** Optional markdown content transform hook applied to markdown-like files. */
  transformFileMarkdownFn?: (contents: string, content: LocalPluginContent) => string;
  /** Optional filename transform hook used before writing transformed files. */
  transformFilenameFn?: (filename: string, defaultSuffix: 'md') => string;
}

/** Folder selection config for whitelist or blacklist semantics. */
export interface FolderSelectionConfig {
  /** Folder names to include or exclude depending on mode. */
  folders: string[];
  /** Selection strategy used by this list. */
  mode: 'blacklist' | 'whitelist';
}

/** Optional custom sync/clear handler; when set, the behavior delegates to it instead of generic logic. */
export interface LocalPluginsContentSyncCustomHandler {
  clear(context: SyncBehaviorContext): Result<void, Error>;
  sync(context: SyncBehaviorContext): Result<void, Error>;
}

/** Options for generic or custom-handler local plugins content sync behavior. */
export interface LocalPluginsContentSyncBehaviorOptions {
  /** Optional custom handler; when set, sync/clear delegate to it instead of built-in generic logic. */
  customHandler?: LocalPluginsContentSyncCustomHandler;
  /** Optional excluded patterns overriding config-level `excluded` for this behavior. */
  excluded?: string[];
  /** Optional whitelist/blacklist control over top-level plugin entries. */
  folderSelection?: FolderSelectionConfig;
  /** Optional per-folder transform map for filename/content transforms. */
  folderTransforms?: Record<string, FolderTransformOptions | true>;
  /** Manifest path used to track outputs for teardown. */
  manifestPath: string;
  /** Optional callback to inspect/override each plugin top-level entry before processing. */
  processPluginFolderOrFile?: (content: LocalPluginContent) => LocalPluginContentOverride | false;
  /** Manifest capability key for plugin eligibility (generic path only). Defaults to context.agentName when omitted. */
  requiredManifestKey?: PluginManifestKey | 'none';
  /** Root output directory for synced content (generic path only). */
  targetRoot: string;
}

/** Manifest shape used by generic strategy to track managed output paths. */
interface GenericManifestShape {
  paths: string[];
}

/** Custom data registered by this behavior (generic strategy: paths for teardown). */
export interface LocalPluginsContentSyncCustomData {
  paths: string[];
}

/** Returns whether a discovered plugin satisfies the required manifest filter. */
function hasRequiredManifest(
  requiredManifestKey: LocalPluginsContentSyncBehaviorOptions['requiredManifestKey'],
  plugin: { manifests: Record<string, boolean> }
): boolean {
  if (!requiredManifestKey || requiredManifestKey === 'none') return true;
  return plugin.manifests[requiredManifestKey] === true;
}

/** Returns whether a top-level plugin entry should be included by folder selection rules. */
function isIncludedFolder(
  folderSelection: FolderSelectionConfig | undefined,
  name: string
): boolean {
  if (!folderSelection) return true;
  const selected = folderSelection.folders.includes(name);
  return folderSelection.mode === 'whitelist' ? selected : !selected;
}

export class LocalPluginsContentSyncBehavior extends SyncBehaviorBase<LocalPluginsContentSyncBehaviorOptions> {
  constructor(options?: LocalPluginsContentSyncBehaviorOptions) {
    super(options);
  }

  /** Clears generic strategy outputs from stored entry (unified manifest) or legacy manifest file. */
  private clearGeneric(context: SyncBehaviorContext): Result<void, Error> {
    const entry = context.manifestContent;
    if (entry && typeof entry === 'object' && entry.customData) {
      const data = entry.customData as LocalPluginsContentSyncCustomData;
      if (Array.isArray(data.paths)) {
        syncFs.unlinkPaths(context.repoRoot, data.paths);
        return ok(undefined);
      }
    }
    const options = this.options;
    if (!options) return ok(undefined);
    const manifestPath = path.join(context.repoRoot, options.manifestPath);
    const manifestResult = syncFs.readJsonManifest<GenericManifestShape>(manifestPath);
    if (manifestResult.isErr()) {
      const e = manifestResult.error as Error & { code?: string };
      if (e.code === 'ENOENT') return ok(undefined);
      return err(manifestResult.error);
    }
    const paths = manifestResult.value.paths ?? [];
    syncFs.unlinkPaths(context.repoRoot, paths);
    syncFs.unlinkIfExists(manifestPath);
    return ok(undefined);
  }

  /** Syncs plugin entries for generic strategy with optional transforms and overrides. */
  private syncGeneric(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    const created: string[] = [];
    const excluded = options.excluded ?? context.tsConfig?.excluded;
    const targetRoot = path.join(context.repoRoot, options.targetRoot);
    syncFs.ensureDir(targetRoot);

    for (const marketplace of context.marketplaces) {
      for (const plugin of marketplace.plugins) {
        const manifestKey = options.requiredManifestKey ?? context.agentName;
        if (!hasRequiredManifest(manifestKey, plugin)) continue;
        const entries = syncFs.readdirWithTypes(plugin.path);
        for (const entry of entries) {
          if (!isIncludedFolder(options.folderSelection, entry.name)) continue;

          const sourcePath = path.join(plugin.path, entry.name);
          const defaultTarget = path.join(targetRoot, plugin.name, entry.name);
          const localContent: LocalPluginContent = {
            absolutePath: sourcePath,
            agentName: context.agentName,
            entryName: entry.name,
            extension: path.extname(entry.name),
            isDirectory: entry.isDirectory,
            isFile: entry.isFile,
            pluginName: plugin.name,
            relativePluginPath: plugin.relativePath,
            targetPath: defaultTarget,
            topLevelEntryName: entry.name,
          };

          const override = options.processPluginFolderOrFile?.(localContent);
          if (override === false || override?.skip === true) continue;

          const fileName = override?.filename ?? entry.name;
          const targetPath = override?.targetPath ?? path.join(targetRoot, plugin.name, fileName);
          const relativeTarget = path.relative(context.repoRoot, targetPath).replace(/\\/g, '/');
          if (isExcluded(relativeTarget, excluded)) continue;

          syncFs.ensureDir(path.dirname(targetPath));
          if (entry.isDirectory || override?.symlink === true) {
            syncFs.symlinkRelative(sourcePath, targetPath);
            created.push(relativeTarget);
            continue;
          }

          const transformConfig = options.folderTransforms?.[entry.name];
          let writePath = targetPath;
          if (transformConfig && transformConfig !== true && transformConfig.transformFilenameFn) {
            const transformed = transformConfig.transformFilenameFn(fileName, 'md');
            writePath = path.join(path.dirname(targetPath), transformed);
          }

          let contents = override?.fileContents ?? syncFs.readFileUtf8(sourcePath);
          if (
            transformConfig &&
            transformConfig !== true &&
            transformConfig.transformFileMarkdownFn &&
            /\.(md|mdc|markdown)$/i.test(fileName)
          ) {
            contents = transformConfig.transformFileMarkdownFn(contents, localContent);
          }
          syncFs.writeFileUtf8(writePath, contents);
          created.push(path.relative(context.repoRoot, writePath).replace(/\\/g, '/'));
        }
      }
    }

    const key = context.currentBehaviorManifestKey ?? 'localPluginsContentSync';
    context.registerContentToMmaappssSyncManifest(context.agentName, key, {
      options: context.currentBehaviorOptionsForManifest,
      customData: { paths: created } satisfies LocalPluginsContentSyncCustomData,
    });
    return ok(undefined);
  }

  /** Sync-phase enabled hook: custom handler or generic sync. */
  override syncRunEnabled(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    if (options.customHandler) return options.customHandler.sync(context);
    const clearResult = this.clearGeneric(context);
    if (clearResult.isErr()) return clearResult;
    return this.syncGeneric(context);
  }

  /** Sync-phase disabled hook: custom handler or generic clear. */
  override syncRunDisabled(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    if (options.customHandler) return options.customHandler.clear(context);
    return this.clearGeneric(context);
  }

  /** Clear hook that delegates to disabled behavior. */
  override clearRun(context: SyncBehaviorContext): Result<void, Error> {
    return this.syncRunDisabled(context);
  }
}
