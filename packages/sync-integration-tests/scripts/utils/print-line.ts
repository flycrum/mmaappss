/**
 * Structured test output: color + indents + text, with chalk formatting for the harness.
 */

import chalk from 'chalk';

export type PrintLineColor = 'dim' | 'white' | 'red' | 'green' | 'yellow' | 'cyan';

export interface PrintLine {
  color: PrintLineColor;
  indents: number;
  text: string;
}

function indent(text: string, spaces: number): string {
  return ' '.repeat(spaces) + text;
}

/**
 * Namespaced print-line utilities for integration test output.
 */
export const printLine = {
  /**
   * Returns the line with indents applied and chalk color applied (for console output).
   */
  getFormatted(line: PrintLine): string {
    const indented = indent(line.text, line.indents);
    switch (line.color) {
      case 'dim':
        return chalk.dim(indented);
      case 'white':
        return chalk.white(indented);
      case 'red':
        return chalk.red(indented);
      case 'green':
        return chalk.green(indented);
      case 'yellow':
        return chalk.yellow(indented);
      case 'cyan':
        return chalk.cyan(indented);
      default:
        return indented;
    }
  },

  /**
   * Creates a PrintLine (for pushing or composing).
   */
  create(color: PrintLineColor, indents: number, text: string): PrintLine {
    return { color, indents, text };
  },

  /**
   * Pushes a PrintLine to the errors array.
   * When doInsertNewline is true, pushes a blank line after this one.
   */
  pushError(
    errors: PrintLine[],
    color: PrintLineColor,
    indents: number,
    text: string,
    doInsertNewline?: boolean
  ): void {
    errors.push(printLine.create(color, indents, text));
    if (doInsertNewline) {
      errors.push(printLine.create('dim', indents, ''));
    }
  },
};
