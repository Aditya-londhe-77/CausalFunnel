import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSessions, fetchHeatmap, fetchSessionEvents } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorBox from '../components/ErrorBox';

// Preview canvas dimensions
const PREVIEW_WIDTH = '100%';
const PREVIEW_HEIGHT = 520;

// ── Heatmap canvas ────────────────────────────────────────────────────────────

function HeatmapCanvas({ clicks }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 800, height: PREVIEW_HEIGHT });

  // Measure the rendered container width for scaling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDims({ width: el.offsetWidth, height: PREVIEW_HEIGHT });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (clicks.length === 0) {
    return (
      <div className="state-box">No click events recorded for this page yet.</div>
    );
  }

  // Use the first click's viewport size as reference; fall back to 1280×720
  const refVw = clicks.find((c) => c.viewport_width)?.viewport_width || 1280;
  const refVh = clicks.find((c) => c.viewport_height)?.viewport_height || 720;

  const scaleX = dims.width / refVw;
  const scaleY = PREVIEW_HEIGHT / refVh;

  return (
    <div
      ref={containerRef}
      className="heatmap-preview"
      style={{ height: PREVIEW_HEIGHT }}
    >
      <div className="heatmap-preview-label">
        Webpage Preview ({refVw} × {refVh} viewport — scaled to fit)
      </div>
      {clicks.map((c, i) => {
        if (c.click_x == null || c.click_y == null) return null;
        const left = c.click_x * scaleX;
        const top = c.click_y * scaleY;
        return (
          <div
            key={i}
            className="heatmap-dot"
            style={{ left, top }}
            title={`Click at (${c.click_x}, ${c.click_y})`}
          />
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HeatmapPage() {
  const [urls, setUrls] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [heatmapData, setHeatmapData] = useState(null);
  const [loadingUrls, setLoadingUrls] = useState(true);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);
  const [error, setError] = useState(null);

  // Load distinct page URLs that have click events from the sessions endpoint
  const loadUrls = useCallback(async () => {
    setLoadingUrls(true);
    setError(null);
    try {
      const sessions = await fetchSessions();
      // Gather all URLs by fetching session events isn't efficient here.
      // Instead we directly query the heatmap with a placeholder to discover URLs,
      // OR we fetch sessions and derive URLs from click events by querying all sessions.
      // Best approach: load all sessions, filter those with clicks > 0, then
      // fetch heatmap for the first available URL.
      // For the URL list we fetch the pages from sessions events lazily.
      // Simpler: provide a text input instead, but the spec says dropdown.
      // We'll load events for all sessions that have clicks to gather unique URLs.
      const withClicks = sessions.filter((s) => s.clicks > 0);

      if (withClicks.length === 0) {
        setUrls([]);
        setLoadingUrls(false);
        return;
      }

      // Fetch events for sessions with clicks to collect unique page URLs
      const urlSet = new Set();
      await Promise.all(
        withClicks.slice(0, 20).map(async (s) => {
          try {
            const evs = await fetchSessionEvents(s.session_id);
            evs.filter((e) => e.event_type === 'click').forEach((e) => urlSet.add(e.page_url));
          } catch {}
        })
      );

      const urlList = [...urlSet].sort();
      setUrls(urlList);
      if (urlList.length > 0) setSelectedUrl(urlList[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingUrls(false);
    }
  }, []);

  useEffect(() => { loadUrls(); }, [loadUrls]);

  // Fetch heatmap when URL changes
  useEffect(() => {
    if (!selectedUrl) { setHeatmapData(null); return; }
    let cancelled = false;
    setLoadingHeatmap(true);
    setError(null);
    fetchHeatmap(selectedUrl)
      .then((data) => { if (!cancelled) setHeatmapData(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoadingHeatmap(false); });
    return () => { cancelled = true; };
  }, [selectedUrl]);

  return (
    <>
      <div className="page-header">
        <h1>Click Heatmap</h1>
        <p>Visualize where users click on a given page. Select a URL from the dropdown.</p>
      </div>

      {loadingUrls && <Spinner text="Loading pages with click data…" />}
      {error && <ErrorBox message={error} />}

      {!loadingUrls && !error && urls.length === 0 && (
        <div className="state-box">
          No click events recorded yet. Open the{' '}
          <a href="http://localhost:5000/demo.html" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
            demo page
          </a>{' '}
          and click around to generate data.
        </div>
      )}

      {!loadingUrls && !error && urls.length > 0 && (
        <>
          <div className="heatmap-controls">
            <label htmlFor="url-select">Page URL</label>
            <select
              id="url-select"
              value={selectedUrl}
              onChange={(e) => setSelectedUrl(e.target.value)}
            >
              {urls.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            {heatmapData && (
              <span className="heatmap-info">
                {heatmapData.total_clicks} click{heatmapData.total_clicks !== 1 ? 's' : ''} recorded
              </span>
            )}
          </div>

          <div className="heatmap-canvas-wrap">
            <p className="heatmap-note">
              Each circle represents a recorded click position. Overlapping circles indicate repeated clicks in the same area.
              Coordinates are scaled proportionally from the original viewport dimensions.
            </p>
            {loadingHeatmap && <Spinner text="Loading heatmap…" />}
            {!loadingHeatmap && heatmapData && (
              <HeatmapCanvas clicks={heatmapData.clicks} />
            )}
          </div>
        </>
      )}
    </>
  );
}
