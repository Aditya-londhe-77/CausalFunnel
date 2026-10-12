/**
 * tracker.js — Lightweight user interaction tracking script.
 *
 * Include on any webpage:
 *   <script src="http://localhost:5000/tracker.js"></script>
 *
 * Records page_view on load and click events with coordinates.
 * Never collects passwords, form contents, or keystrokes.
 */
(function () {
  'use strict';

  var BACKEND_URL = 'http://localhost:5000/api/events';
  var SESSION_KEY = 'tracker_session_id';

  // ── Session ID ──────────────────────────────────────────────────────────────

  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getSessionId() {
    try {
      var id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = generateId();
        localStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (e) {
      // localStorage unavailable (e.g. private mode on some browsers)
      return generateId();
    }
  }

  var SESSION_ID = getSessionId();

  // ── Send event ──────────────────────────────────────────────────────────────

  function sendEvent(eventType, extras) {
    var payload = Object.assign(
      {
        session_id: SESSION_ID,
        event_type: eventType,
        page_url: window.location.href,
        timestamp: new Date().toISOString(),
        click_x: null,
        click_y: null,
        viewport_width: window.innerWidth || null,
        viewport_height: window.innerHeight || null,
      },
      extras || {}
    );

    // Use sendBeacon when available for reliability during page unload
    if (eventType !== 'page_view' && navigator.sendBeacon) {
      var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(BACKEND_URL, blob);
      return;
    }

    // Fall back to fetch
    fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(function (err) {
      // Silently absorb network failures — tracking should never break the page
      console.warn('[tracker] Failed to send event:', err.message);
    });
  }

  // ── Event listeners ─────────────────────────────────────────────────────────

  // Page view — fire immediately
  sendEvent('page_view');

  // Click — capture coordinates
  document.addEventListener('click', function (e) {
    sendEvent('click', {
      click_x: e.clientX,
      click_y: e.clientY,
    });
  }, { passive: true });

})();
