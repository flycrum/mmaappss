import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { jsonPatch } from './json-patch.js';

describe('json-patch', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'mmaappss-json-patch-'));
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  describe('readJson', () => {
    it('returns err when file does not exist', () => {
      const filePath = path.join(tmpDir, 'missing.json');
      const result = jsonPatch.readJson<{ foo: string }>(filePath);

      expect(result.isErr()).toBe(true);
    });

    it('parses valid JSON and returns typed value', () => {
      const filePath = path.join(tmpDir, 'data.json');
      fs.writeFileSync(filePath, '{"name":"mmaappss","count":1}');

      const result = jsonPatch.readJson<{ name: string; count: number }>(filePath);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ name: 'mmaappss', count: 1 });
    });

    it('returns err on invalid JSON', () => {
      const filePath = path.join(tmpDir, 'bad.json');
      fs.writeFileSync(filePath, 'not valid json {');

      const result = jsonPatch.readJson(filePath);

      expect(result.isErr()).toBe(true);
    });

    it('returns ok when validator passes', () => {
      const filePath = path.join(tmpDir, 'data.json');
      fs.writeFileSync(filePath, '{"name":"x","count":2}');
      const validator = (data: unknown): data is { name: string; count: number } =>
        typeof data === 'object' &&
        data !== null &&
        'name' in data &&
        typeof (data as { name: unknown }).name === 'string' &&
        'count' in data &&
        typeof (data as { count: unknown }).count === 'number';

      const result = jsonPatch.readJson<{ name: string; count: number }>(filePath, validator);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ name: 'x', count: 2 });
    });

    it('returns err when validator fails', () => {
      const filePath = path.join(tmpDir, 'data.json');
      fs.writeFileSync(filePath, '{"name":"x"}');
      const validator = (data: unknown): data is { name: string; count: number } =>
        typeof data === 'object' &&
        data !== null &&
        'count' in data &&
        typeof (data as { count: unknown }).count === 'number';

      const result = jsonPatch.readJson<{ name: string; count: number }>(filePath, validator);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().message).toContain('validation failed');
    });
  });

  describe('writeJson', () => {
    it('writes JSON and creates parent dir', () => {
      const filePath = path.join(tmpDir, 'nested', 'out.json');
      const data = { plugins: [{ name: 'foo' }] };

      const result = jsonPatch.writeJson(filePath, data);

      expect(result.isOk()).toBe(true);
      expect(fs.existsSync(filePath)).toBe(true);
      expect(JSON.parse(fs.readFileSync(filePath, 'utf8'))).toEqual(data);
    });
  });

  describe('applyPatch', () => {
    it('applies replace op', () => {
      const doc = { name: 'old', count: 1 };
      const result = jsonPatch.applyPatch(doc, [{ op: 'replace', path: '/name', value: 'new' }]);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ name: 'new', count: 1 });
    });

    it('applies add op', () => {
      const doc = { name: 'foo' };
      const result = jsonPatch.applyPatch(doc, [{ op: 'add', path: '/version', value: '1.0' }]);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ name: 'foo', version: '1.0' });
    });

    it('applies remove op', () => {
      const doc = { name: 'foo', unused: true };
      const result = jsonPatch.applyPatch(doc, [{ op: 'remove', path: '/unused' }]);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ name: 'foo' });
    });

    it('returns err on invalid patch', () => {
      const doc = { name: 'foo' };
      const result = jsonPatch.applyPatch(doc, [{ op: 'remove', path: '/nonexistent' }]);

      expect(result.isErr()).toBe(true);
    });

    it('returns doc unchanged when ops is empty', () => {
      const doc = { a: 1 };
      const result = jsonPatch.applyPatch(doc, []);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(doc);
    });
  });
});
