'use strict';

const ALLOWED_EVENT_TYPES = ['page_view', 'click'];

/**
 * Validate a single event payload.
 * Returns { valid: true } or { valid: false, error: 'message' }
 */
function validateEvent(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  const { session_id, event_type, page_url, timestamp } = body;

  if (!session_id || typeof session_id !== 'string' || session_id.trim() === '') {
    return { valid: false, error: 'session_id is required and must be a non-empty string.' };
  }

  if (!event_type || !ALLOWED_EVENT_TYPES.includes(event_type)) {
    return { valid: false, error: `event_type must be one of: ${ALLOWED_EVENT_TYPES.join(', ')}.` };
  }

  if (!page_url || typeof page_url !== 'string' || page_url.trim() === '') {
    return { valid: false, error: 'page_url is required and must be a non-empty string.' };
  }

  try {
    new URL(page_url);
  } catch {
    return { valid: false, error: 'page_url must be a valid URL.' };
  }

  if (!timestamp) {
    return { valid: false, error: 'timestamp is required.' };
  }

  const ts = new Date(timestamp);
  if (isNaN(ts.getTime())) {
    return { valid: false, error: 'timestamp must be a valid ISO 8601 date string.' };
  }

  if (event_type === 'click') {
    const { click_x, click_y } = body;
    if (typeof click_x !== 'number' || typeof click_y !== 'number') {
      return { valid: false, error: 'click_x and click_y must be numbers for click events.' };
    }
  }

  return { valid: true };
}

/**
 * Sanitize and normalize an event for storage.
 */
function sanitizeEvent(body) {
  const doc = {
    session_id: String(body.session_id).trim(),
    event_type: body.event_type,
    page_url: String(body.page_url).trim(),
    timestamp: new Date(body.timestamp),
    click_x: body.event_type === 'click' ? Number(body.click_x) : null,
    click_y: body.event_type === 'click' ? Number(body.click_y) : null,
    viewport_width: typeof body.viewport_width === 'number' ? body.viewport_width : null,
    viewport_height: typeof body.viewport_height === 'number' ? body.viewport_height : null,
  };
  return doc;
}

module.exports = { validateEvent, sanitizeEvent };
