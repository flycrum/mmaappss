/**
 * Shared file-system helpers for sync scripts (rules-sync, cursor-content-sync, claude-md-sync, etc.).
 * Uses fs-extra for ensureDir/outputFile; provides symlink, manifest, and teardown helpers.
 */

import fse from 'fs-extra';
import { err, ok, Result } from 'neverthrow';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Namespaced file-system utilities for sync scripts.
 */
export const syncFs = {
  /**
   * Ensure a directory exists (create recursively). No-op if already exists.
   */
  ensureDir(dir: string): void {
    fse.ensureDirSync(dir);
  },

  /**
   * Return true if path exists and is a file.
   */
  isFile(p: string): boolean {
    try {
      return fs.statSync(p).isFile();
    } catch {
      return false;
    }
  },

  /**
   * Return true if path exists and is a symbolic link.
   */
  isSymlink(p: string): boolean {
    try {
      return fs.lstatSync(p).isSymbolicLink();
    } catch {
      return false;
    }
  },

  /**
   * List file names in dir matching pattern (if given). Returns [] if dir does not exist.
   */
  listFiles(dir: string, pattern?: RegExp): string[] {
    if (!fs.existsSync(dir)) return [];
    const names = fs.readdirSync(dir);
    if (!pattern) return names;
    return names.filter((f) => pattern.test(f));
  },

  /**
   * List directory names in dir for which predicate(absoluteSubdirPath) is true. Returns [] if dir does not exist.
   */
  listSubdirsWhere(dir: string, predicate: (absoluteSubdirPath: string) => boolean): string[] {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const out: string[] = [];
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const subPath = path.join(dir, e.name);
      if (predicate(subPath)) out.push(e.name);
    }
    return out;
  },

  /**
   * Return true if path exists.
   */
  pathExists(p: string): boolean {
    return fs.existsSync(p);
  },

  /**
   * Remove empty immediate subdirs of parentDir, then remove parentDir if empty.
   * Idempotent; ignores errors (e.g. dir in use).
   */
  pruneEmptySubdirsThenParent(parentDir: string): void {
    if (!fs.existsSync(parentDir)) return;
    const entries = fs.readdirSync(parentDir, { withFileTypes: true });
    for (const d of entries) {
      if (d.isDirectory()) {
        const subPath = path.join(parentDir, d.name);
        const subEntries = fs.readdirSync(subPath);
        if (subEntries.length === 0) {
          try {
            fs.rmdirSync(subPath);
          } catch {
            // ignore
          }
        }
      }
    }
    const remaining = fs.readdirSync(parentDir);
    if (remaining.length === 0) {
      try {
        fs.rmdirSync(parentDir);
      } catch {
        // ignore
      }
    }
  },

  /**
   * Read directory entries with name and isDirectory. Returns [] if dir does not exist.
   */
  readdirWithTypes(dir: string): Array<{ name: string; isDirectory: boolean }> {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).map((e) => ({
      name: e.name,
      isDirectory: e.isDirectory(),
    }));
  },

  /**
   * Read file as UTF-8. Throws on error.
   */
  readFileUtf8(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
  },

  /**
   * Read and parse a JSON manifest. Returns Err if file missing or invalid JSON.
   */
  readJsonManifest<T>(manifestPath: string): Result<T, Error> {
    if (!fs.existsSync(manifestPath)) {
      return err(new Error(`${manifestPath}: file not found`));
    }
    try {
      const raw = fs.readFileSync(manifestPath, 'utf8');
      const parsed = JSON.parse(raw) as T;
      return ok(parsed);
    } catch (e) {
      return err(new Error(`${manifestPath}: ${e instanceof Error ? e.message : String(e)}`));
    }
  },

  /**
   * Read the target of a symbolic link. Throws on error.
   */
  readlink(p: string): string {
    return fs.readlinkSync(p);
  },

  /**
   * Symlink sourcePath at linkPath using a relative path from linkPath to sourcePath.
   * Unlinks linkPath first if it already exists. Throws on error.
   */
  symlinkRelative(sourcePath: string, linkPath: string): void {
    if (fs.existsSync(linkPath)) fs.unlinkSync(linkPath);
    const relativeTarget = path.relative(path.dirname(linkPath), sourcePath);
    fs.symlinkSync(relativeTarget, linkPath);
  },

  /**
   * Unlink a single file if it exists. No-op if path is missing. Idempotent.
   */
  unlinkIfExists(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // ignore
    }
  },

  /**
   * Unlink each path (repoRoot + relPath). Idempotent; ignores missing or errors.
   */
  unlinkPaths(repoRoot: string, relPaths: string[]): void {
    for (const rel of relPaths) {
      const full = path.join(repoRoot, rel);
      try {
        if (fs.existsSync(full)) fs.unlinkSync(full);
      } catch {
        // ignore
      }
    }
  },

  /**
   * Write file as UTF-8. Throws on error.
   */
  writeFileUtf8(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content, 'utf8');
  },

  /**
   * Write a JSON manifest file; creates parent directories if needed.
   */
  writeJsonManifest(manifestPath: string, data: object): void {
    fse.outputFileSync(manifestPath, JSON.stringify(data, null, 2), 'utf8');
  },
};
