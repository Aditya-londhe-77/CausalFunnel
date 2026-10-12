'use strict';

const { getDb } = require('../db');
const { validateEvent, sanitizeEvent } = require('../validation');
const { sendJson, parseBody } = require('../helpers');

/**
 * POST /api/events
 * Accept and store a single tracking event.
 */
async function handlePostEvent(req, res) {
  let body;
  try {
    body = await parseBody(req);
  } catch (err) {
    return sendJson(res, 400, { error: err.message });
  }

  const validation = validateEvent(body);
  if (!validation.valid) {
    return sendJson(res, 400, { error: validation.error });
  }

  const doc = sanitizeEvent(body);

  try {
    const db = getDb();
    const result = await db.collection('events').insertOne(doc);
    return sendJson(res, 201, { success: true, id: result.insertedId });
  } catch (err) {
    console.error('[events] DB insert error:', err.message);
    return sendJson(res, 500, { error: 'Failed to store event.' });
  }
}

/**
 * GET /api/sessions
 * Return all sessions with aggregated event counts.
 */
async function handleGetSessions(req, res) {
  try {
    const db = getDb();
    const sessions = await db.collection('events').aggregate([
      {
        $group: {
          _id: '$session_id',
          total_events: { $sum: 1 },
          page_views: {
            $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
          },
          first_activity: { $min: '$timestamp' },
          last_activity: { $max: '$timestamp' },
        },
      },
      { $sort: { last_activity: -1 } },
      {
        $project: {
          _id: 0,
          session_id: '$_id',
          total_events: 1,
          page_views: 1,
          clicks: 1,
          first_activity: 1,
          last_activity: 1,
        },
      },
    ]).toArray();

    return sendJson(res, 200, { sessions });
  } catch (err) {
    console.error('[sessions] DB error:', err.message);
    return sendJson(res, 500, { error: 'Failed to fetch sessions.' });
  }
}

/**
 * GET /api/sessions/:sessionId/events
 * Return all events for a specific session, sorted chronologically.
 */
async function handleGetSessionEvents(req, res, sessionId) {
  if (!sessionId || sessionId.trim() === '') {
    return sendJson(res, 400, { error: 'Session ID is required.' });
  }

  try {
    const db = getDb();
    const events = await db.collection('events')
      .find({ session_id: sessionId }, {
        projection: {
          _id: 0,
          event_type: 1,
          page_url: 1,
          timestamp: 1,
          click_x: 1,
          click_y: 1,
          viewport_width: 1,
          viewport_height: 1,
        },
      })
      .sort({ timestamp: 1 })
      .toArray();

    return sendJson(res, 200, { session_id: sessionId, events });
  } catch (err) {
    console.error('[session events] DB error:', err.message);
    return sendJson(res, 500, { error: 'Failed to fetch session events.' });
  }
}

/**
 * GET /api/heatmap?url=<encoded-page-url>
 * Return click events for a specific page URL.
 */
async function handleGetHeatmap(req, res, searchParams) {
  const pageUrl = searchParams.get('url');

  if (!pageUrl) {
    return sendJson(res, 400, { error: 'Query parameter "url" is required.' });
  }

  try {
    new URL(pageUrl);
  } catch {
    return sendJson(res, 400, { error: 'Query parameter "url" must be a valid URL.' });
  }

  try {
    const db = getDb();
    const clicks = await db.collection('events')
      .find(
        { page_url: pageUrl, event_type: 'click' },
        {
          projection: {
            _id: 0,
            click_x: 1,
            click_y: 1,
            viewport_width: 1,
            viewport_height: 1,
            timestamp: 1,
          },
        }
      )
      .sort({ timestamp: 1 })
      .toArray();

    return sendJson(res, 200, { page_url: pageUrl, total_clicks: clicks.length, clicks });
  } catch (err) {
    console.error('[heatmap] DB error:', err.message);
    return sendJson(res, 500, { error: 'Failed to fetch heatmap data.' });
  }
}

/**
 * GET /api/health
 */
function handleHealth(req, res) {
  sendJson(res, 200, { status: 'OK' });
}

module.exports = {
  handlePostEvent,
  handleGetSessions,
  handleGetSessionEvents,
  handleGetHeatmap,
  handleHealth,
};
