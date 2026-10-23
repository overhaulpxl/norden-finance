import { ParseResult } from '../types';
import { parseTransaction } from './parser';

/**
 * Natural language transaction parser.
 * Uses local deterministic parsing rules (zero external AI network dependencies).
 */
export async function parseTransactionWithAI(input: string): Promise<ParseResult> {
  return parseTransaction(input);
}
