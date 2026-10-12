/**
 * Format an ISO timestamp to a short human-readable string.
 */
export function formatTime(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return ts;
  }
}

/**
 * Truncate a string to maxLen characters.
 */
export function truncate(str, maxLen = 60) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/**
 * Shorten a session ID for display (first 8 chars).
 */
export function shortId(id) {
  if (!id) return '—';
  return id.slice(0, 8) + '…';
}
