import { ok, Result } from 'neverthrow';
import path from 'node:path';
import { isExcluded } from '../../common/excluded-patterns.js';
import { pathHelpers } from '../../common/path-helpers.js';
import { syncFs } from '../../common/sync-fs.js';
import { syncManifest } from '../../common/sync-manifest.js';
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
  /** Optional callback to inspect/override each plugin top-level entry before processing. */
  processPluginFolderOrFile?: (content: LocalPluginContent) => LocalPluginContentOverride | false;
  /** Manifest capability key for plugin eligibility (generic path only). Defaults to context.agentName when omitted. */
  requiredManifestKey?: PluginManifestKey | 'none';
  /** Root output directory for synced content (generic path only). */
  targetRoot: string;
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

  /** Syncs plugin entries for generic strategy with optional transforms and overrides. Registers symlinks and fsAutoRemoval for central teardown. */
  private syncGeneric(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    const symlinkPaths: string[] = [];
    const fsAutoRemovalPaths: string[] = [];
    const excluded = options.excluded ?? context.tsConfig?.excluded;
    const targetRoot = pathHelpers.joinRepo(context.outputRoot, options.targetRoot);
    syncFs.ensureDir(targetRoot);

    const entry = context.manifestContent;
    if (entry && typeof entry === 'object') {
      syncManifest.teardownEntry(context.outputRoot, entry);
    }

    for (const marketplace of context.marketplaces) {
      for (const plugin of marketplace.plugins) {
        const manifestKey = options.requiredManifestKey ?? context.agentName;
        if (!hasRequiredManifest(manifestKey, plugin)) continue;
        const dirEntries = syncFs.readdirWithTypes(plugin.path);
        for (const dirEntry of dirEntries) {
          if (!isIncludedFolder(options.folderSelection, dirEntry.name)) continue;

          const sourcePath = path.join(plugin.path, dirEntry.name);
          const defaultTarget = path.join(targetRoot, plugin.name, dirEntry.name);
          const localContent: LocalPluginContent = {
            absolutePath: sourcePath,
            agentName: context.agentName,
            entryName: dirEntry.name,
            extension: path.extname(dirEntry.name),
            isDirectory: dirEntry.isDirectory,
            isFile: dirEntry.isFile,
            pluginName: plugin.name,
            relativePluginPath: plugin.relativePath,
            targetPath: defaultTarget,
            topLevelEntryName: dirEntry.name,
          };

          const override = options.processPluginFolderOrFile?.(localContent);
          if (override === false || override?.skip === true) continue;

          const fileName = override?.filename ?? dirEntry.name;
          const targetPath = override?.targetPath ?? path.join(targetRoot, plugin.name, fileName);
          const relativeTarget = path.relative(context.outputRoot, targetPath).replace(/\\/g, '/');
          if (isExcluded(relativeTarget, excluded)) continue;

          syncFs.ensureDir(path.dirname(targetPath));
          if (dirEntry.isDirectory || override?.symlink === true) {
            syncFs.symlinkRelative(sourcePath, targetPath);
            symlinkPaths.push(relativeTarget);
            continue;
          }

          const transformConfig = options.folderTransforms?.[dirEntry.name];
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
          fsAutoRemovalPaths.push(path.relative(context.outputRoot, writePath).replace(/\\/g, '/'));
        }
      }
    }

    const key = context.currentBehaviorManifestKey ?? 'localPluginsContentSync';
    context.registerContentToMmaappssSyncManifest(context.agentName, key, {
      options: context.currentBehaviorOptionsForManifest,
      symlinks: symlinkPaths,
      fsAutoRemoval: fsAutoRemovalPaths,
    });
    return ok(undefined);
  }

  /** Sync-phase enabled hook: custom handler or generic sync. */
  override syncRunEnabled(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (!options) return ok(undefined);
    if (options.customHandler) return options.customHandler.sync(context);
    return this.syncGeneric(context);
  }

  /** When behavior is disabled during sync, run custom clear or teardown this entry. */
  override syncRunDisabled(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (options?.customHandler) return options.customHandler.clear(context);
    const entry = context.manifestContent;
    if (entry && typeof entry === 'object') syncManifest.teardownEntry(context.outputRoot, entry);
    return ok(undefined);
  }

  override clearRun(context: SyncBehaviorContext): Result<void, Error> {
    const options = this.options;
    if (options?.customHandler) return options.customHandler.clear(context);
    return ok(undefined);
  }
}
