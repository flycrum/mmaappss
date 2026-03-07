/**
 * Thin wrapper around fast-json-patch for surgical JSON edits.
 * Used for marketplace.json and settings.json.
 */

import type { Operation } from 'fast-json-patch';
import * as patch from 'fast-json-patch';
import { err, ok, Result } from 'neverthrow';
import fs from 'node:fs';
import path from 'node:path';

const patchApi = patch.default ?? patch;

function applyOps(doc: unknown, ops: Operation[]): Result<unknown, Error> {
  if (ops.length === 0) return ok(doc);
  try {
    const validateErr = patchApi.validate(ops);
    if (validateErr) throw validateErr;
    const result = patchApi.applyPatch(doc, ops, true, false);
    return ok(result.newDocument ?? doc);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

/**
 * JSON read/write and RFC 6902 patch utilities for surgical edits.
 */
export const jsonPatch = {
  /**
   * Read JSON file. Returns err on missing file or parse failure.
   */
  readJson<T>(filePath: string): Result<T, Error> {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      return ok(JSON.parse(raw) as T);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      return err(new Error(`${filePath}: ${errMsg}`));
    }
  },
  /**
   * Write JSON file. Ensures parent dir exists.
   */
  writeJson(filePath: string, data: unknown): Result<void, Error> {
    try {
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },
  /**
   * Apply RFC 6902 patch operations to a document.
   * Returns the patched document as unknown; callers should narrow or validate if a specific type is required.
   */
  applyPatch<T>(doc: T, ops: Operation[]): Result<unknown, Error> {
    return applyOps(doc, ops);
  },
};
