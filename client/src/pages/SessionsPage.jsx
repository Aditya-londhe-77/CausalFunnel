import { useState, useEffect, useCallback } from 'react';
import { fetchSessions, fetchSessionEvents } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorBox from '../components/ErrorBox';
import { formatTime, shortId } from '../components/utils';

// ── Sessions list ─────────────────────────────────────────────────────────────

function SessionsTable({ sessions, onSelect }) {
  const totalEvents = sessions.reduce((s, r) => s + r.total_events, 0);
  const totalClicks = sessions.reduce((s, r) => s + r.clicks, 0);
  const totalViews = sessions.reduce((s, r) => s + r.page_views, 0);

  return (
    <>
      <div className="stat-bar">
        <div className="stat-card">
          <div className="label">Sessions</div>
          <div className="value">{sessions.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Events</div>
          <div className="value">{totalEvents}</div>
        </div>
        <div className="stat-card">
          <div className="label">Page Views</div>
          <div className="value">{totalViews}</div>
        </div>
        <div className="stat-card">
          <div className="label">Clicks</div>
          <div className="value">{totalClicks}</div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="state-box">
          No sessions recorded yet. Open the{' '}
          <a href="http://localhost:5000/demo.html" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
            demo page
          </a>{' '}
          to start tracking.
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Events</th>
                <th>Views</th>
                <th>Clicks</th>
                <th>First Seen</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.session_id} onClick={() => onSelect(s)} title="Click to view events">
                  <td><span className="session-id">{s.session_id}</span></td>
                  <td>{s.total_events}</td>
                  <td>{s.page_views}</td>
                  <td>{s.clicks}</td>
                  <td>{formatTime(s.first_activity)}</td>
                  <td>{formatTime(s.last_activity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ── Session detail / timeline ─────────────────────────────────────────────────

function SessionDetail({ session, onBack }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSessionEvents(session.session_id)
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [session.session_id]);

  return (
    <>
      <button className="back-btn" onClick={onBack}>← Back to Sessions</button>

      <div className="session-header">
        <div>
          <h2>Session Events</h2>
          <span className="sid">{session.session_id}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: '#555' }}>
          <span>📄 {session.page_views} views</span>
          <span>🖱 {session.clicks} clicks</span>
          <span>⏱ {formatTime(session.first_activity)}</span>
        </div>
      </div>

      {loading && <Spinner text="Loading events…" />}
      {error && <ErrorBox message={error} />}

      {!loading && !error && events.length === 0 && (
        <div className="state-box">No events found for this session.</div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="timeline">
          {events.map((ev, i) => (
            <div className="timeline-item" key={i}>
              <div className={`tl-icon ${ev.event_type === 'click' ? 'click' : 'view'}`}>
                {ev.event_type === 'click' ? '🖱' : '📄'}
              </div>
              <div className="tl-body">
                <span className={`badge ${ev.event_type === 'click' ? 'badge-click' : 'badge-view'}`}>
                  {ev.event_type}
                </span>
                <div className="tl-url" title={ev.page_url}>{ev.page_url}</div>
                <div className="tl-meta">
                  {formatTime(ev.timestamp)}
                  {ev.event_type === 'click' && ev.click_x != null && (
                    <span className="tl-coords"> &nbsp;· coords ({ev.click_x}, {ev.click_y})</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchSessions()
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (selected) {
    return (
      <SessionDetail
        session={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Sessions</h1>
        <p>All tracked user sessions. Click a row to view the event timeline.</p>
      </div>

      {loading && <Spinner text="Fetching sessions…" />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && (
        <SessionsTable sessions={sessions} onSelect={setSelected} />
      )}
    </>
  );
}
