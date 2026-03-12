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
   * Without a validator, the parsed value is cast to T; callers must ensure the file content matches T.
   * If validator is provided, it is run after parse and err is returned when validation fails.
   *
   * @param filePath - Path to the JSON file
   * @param validator - Optional type guard; when provided, parsed data must pass or readJson returns err
   */
  readJson<T>(filePath: string, validator?: (data: unknown) => data is T): Result<T, Error> {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      if (validator !== undefined) {
        if (!validator(parsed)) {
          return err(new Error(`${filePath}: validation failed`));
        }
        return ok(parsed);
      }
      return ok(parsed as T);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const errObj = new Error(`${filePath}: ${errMsg}`) as Error & { code?: string };
      const code =
        e &&
        typeof e === 'object' &&
        'code' in e &&
        typeof (e as NodeJS.ErrnoException).code === 'string'
          ? (e as NodeJS.ErrnoException).code
          : undefined;
      if (code) errObj.code = code;
      return err(errObj);
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
