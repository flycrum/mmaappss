/**
 * Surgical replace or add a markdown section.
 * Does not corrupt surrounding content. Agent-agnostic; no agent-named exports.
 */

import { err, ok, Result } from 'neverthrow';
import fs from 'node:fs';
import path from 'node:path';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 1-6 for #..######, 0 if line is not a heading. */
function getHeadingLevel(line: string): number {
  const m = line.trimStart().match(/^(#{1,6})\s/);
  return m ? m[1]!.length : 0;
}

/** Options for removeBlocksMatching: which lines start a block and which lines belong to it. */
export interface RemoveBlocksMatchingOptions {
  /** Regex to detect the first line of a block to remove. */
  blockStartLineRegex: RegExp;
  /** Return true for lines that are part of the block after the start line (blank, list, subheading, etc.). */
  isBlockContinuationLine?: (line: string) => boolean;
}

const defaultBlockContinuation = (line: string): boolean => {
  if (/^\s*$/.test(line)) return true;
  if (/^#{1,6}\s/.test(line.trim())) return false;
  if (/^\s*-\s+\[.+\]\(\.\//.test(line)) return true;
  return false;
};

/**
 * Surgical markdown section edit utilities. Generic only; no agent names.
 */
export const markdownSection = {
  /**
   * Remove blocks that start with a line matching blockStartLineRegex.
   * A block runs from that line through subsequent lines for which isBlockContinuationLine returns true.
   */
  removeBlocksMatching(
    filePath: string,
    options: RemoveBlocksMatchingOptions
  ): Result<void, Error> {
    try {
      if (!fs.existsSync(filePath)) return ok(undefined);

      const isContinuation = options.isBlockContinuationLine ?? defaultBlockContinuation;
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split(/\r?\n/);
      const keep: string[] = [];
      let i = 0;

      while (i < lines.length) {
        const line = lines[i]!;
        const trimmed = line.trim();
        if (options.blockStartLineRegex.test(trimmed)) {
          let end = i + 1;
          while (end < lines.length && isContinuation(lines[end]!)) {
            end++;
          }
          i = end;
          continue;
        }
        keep.push(line);
        i++;
      }

      const result = keep
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      fs.writeFileSync(filePath, result ? result + '\n' : '');
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },

  /**
   * Replace a section by heading, or append if it doesn't exist.
   * Section runs from the heading line to the next same-or-higher-level heading (## or #) or EOF.
   * Subsections (### etc.) are part of the section and get replaced.
   */
  replaceOrAddSection(filePath: string, heading: string, newContent: string): Result<void, Error> {
    try {
      const headingRegex = new RegExp(`^(#{1,6})\\s+${escapeRegex(heading)}\\s*$`, 'im');
      let content: string;

      if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, 'utf8');
      } else {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        content = '';
      }

      const lines = content.split(/\r?\n/);
      const headingLineIndex = lines.findIndex((l) => headingRegex.test(l.trim()));
      const headingLevel =
        headingLineIndex >= 0 ? getHeadingLevel(lines[headingLineIndex]!.trim()) : 2;
      const sectionBlock = [
        `${'#'.repeat(headingLevel)} ${heading}`,
        '',
        newContent.trim(),
        '',
      ].join('\n');

      let newLines: string[];

      if (headingLineIndex >= 0) {
        let endIndex = headingLineIndex + 1;
        while (endIndex < lines.length) {
          const lineTrimmed = lines[endIndex]!.trim();
          const level = getHeadingLevel(lineTrimmed);
          if (level > 0 && level <= headingLevel) break;
          endIndex++;
        }
        newLines = [...lines.slice(0, headingLineIndex), sectionBlock, ...lines.slice(endIndex)];
      } else {
        const trimmed = content.trim();
        newLines = trimmed ? [trimmed, '', sectionBlock] : [sectionBlock];
      }

      const result = newLines
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      fs.writeFileSync(filePath, result ? result + '\n' : '');
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },

  /**
   * Remove a section by heading. Leaves file unchanged if section doesn't exist.
   * Section ends at next same-or-higher-level heading (### is subsection, not end).
   */
  removeSection(filePath: string, heading: string): Result<void, Error> {
    try {
      if (!fs.existsSync(filePath)) return ok(undefined);

      const headingRegex = new RegExp(`^(#{1,6})\\s+${escapeRegex(heading)}\\s*$`, 'im');
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split(/\r?\n/);
      const headingLineIndex = lines.findIndex((l) => headingRegex.test(l.trim()));

      if (headingLineIndex < 0) return ok(undefined);

      const headingLineTrimmed = lines[headingLineIndex]!.trim();
      const headingLevel = getHeadingLevel(headingLineTrimmed);
      let endIndex = headingLineIndex + 1;
      while (endIndex < lines.length) {
        const lineTrimmed = lines[endIndex]!.trim();
        const level = getHeadingLevel(lineTrimmed);
        if (level > 0 && level <= headingLevel) break;
        endIndex++;
      }

      const newLines = [...lines.slice(0, headingLineIndex), ...lines.slice(endIndex)];
      const result = newLines
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      fs.writeFileSync(filePath, result ? result + '\n' : '');
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  },
};
