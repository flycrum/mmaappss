/**
 * Structured file logging for mmaappss sync. When loggingEnabled is true, writes JSON logs
 * to repo .mmaappss/logs/mmaappss.log; otherwise no-ops. Call setLoggerContext once at
 * process start (e.g. in sync-runner) before any getLogger() use.
 */

import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import type { MmaappssConfig } from './config-helpers.js';
import { configHelpers } from './config-helpers.js';

const LOG_DIR = '.mmaappss/logs';
const LOG_FILE = 'mmaappss.log';

export type MmaappssLogger = pino.Logger;

let instance: MmaappssLogger | null = null;
let previousLogFd: number | null = null;
let previousDestination: { flush?: () => void; end?: () => void } | null = null;

function closePreviousLogger(): void {
  if (previousDestination != null) {
    if (typeof previousDestination.flush === 'function') previousDestination.flush();
    if (typeof previousDestination.end === 'function') previousDestination.end();
    previousDestination = null;
  }
  if (previousLogFd != null) {
    fs.closeSync(previousLogFd);
    previousLogFd = null;
  }
}

const noopLogger: MmaappssLogger = pino({ level: 'silent' });

/**
 * Set logging context from repo root and config. Call once at process start (e.g. in sync-runner).
 * When logging is disabled, getLogger() returns a no-op logger.
 */
export function setLoggerContext(repoRoot: string, tsConfig: MmaappssConfig | null): void {
  const enabled = configHelpers.general.getLoggingEnabled(repoRoot, tsConfig);
  const hasExistingResources =
    instance !== noopLogger && (previousDestination != null || previousLogFd != null);

  if (!enabled) {
    if (hasExistingResources) closePreviousLogger();
    instance = noopLogger;
    return;
  }

  let fd: number | null = null;
  try {
    const logDir = path.join(repoRoot, LOG_DIR);
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, LOG_FILE);
    fd = fs.openSync(logPath, 'a');
    const dest = pino.destination(fd);
    const newInstance = pino({ name: 'mmaappss', level: 'debug', base: undefined }, dest);
    if (hasExistingResources) closePreviousLogger();
    previousDestination = dest as unknown as { flush?: () => void; end?: () => void };
    previousLogFd = fd;
    instance = newInstance;
    fd = null;
  } finally {
    if (fd != null) fs.closeSync(fd);
  }
}

/**
 * Get the process logger. Returns no-op if setLoggerContext was never called or logging is disabled.
 */
export function getLogger(): MmaappssLogger {
  if (instance === null) {
    return noopLogger;
  }
  return instance;
}
