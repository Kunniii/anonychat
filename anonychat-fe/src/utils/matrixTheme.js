/**
 * Helper to detect Matrix mode easter egg activation commands.
 * Supports:
 * - "hackermodeactivated", "hackermode", "/hackermodeactivated"
 * - Iconic The Matrix lines:
 *   - "wake up neo", "wake up, neo", "the matrix has you", "follow the white rabbit"
 *   - "there is no spoon", "knock knock neo", "free your mind", "take the red pill", "red pill"
 *   - "enter the matrix", "matrix"
 */
export const isMatrixTrigger = (input) => {
  if (!input || typeof input !== 'string') return false;
  const raw = input.trim().toLowerCase();
  // Strip leading slash, hashtag, exclamation mark
  const cleaned = raw.replace(/^[/#!]+/, '').trim();
  // Strip punctuation like commas, periods, quotes, ellipses
  const noPunctuation = cleaned.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const compact = noPunctuation.replace(/\s+/g, '');

  if (compact === 'hackermodeactivated' || compact === 'hackermode') return true;
  if (compact === 'wakeupneo') return true;
  if (compact === 'thematrixhasyou') return true;
  if (compact === 'followthewhiterabbit') return true;
  if (compact === 'thereisnospoon') return true;
  if (compact === 'knockknockneo') return true;
  if (compact === 'freeyourmind') return true;
  if (compact === 'taketheredpill' || compact === 'redpill') return true;
  if (compact === 'enterthematrix') return true;
  if (compact === 'matrix') return true;

  return false;
};

export default isMatrixTrigger;
