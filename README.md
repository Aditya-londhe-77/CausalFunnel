# Interaction Tracker

A full-stack user interaction tracking application built with **pure Node.js**, **React**, and **MongoDB**. Records page views and click events from any webpage and visualises them in a clean dashboard.

---

## Features

- **Tracker script** — include on any page to automatically record page views and clicks
- **Session tracking** — persistent session ID stored in `localStorage`
- **Sessions dashboard** — browse all sessions with event counts and timestamps
- **Event timeline** — chronological view of every event in a session
- **Click heatmap** — visualise click positions scaled to the original viewport
- **REST API** — five endpoints built with Node.js's built-in `http` module (no Express)
- **MongoDB storage** — events stored as individual documents with proper indexes

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js (`http` module, no framework) |
| Database | MongoDB (official `mongodb` driver) |
| Frontend | React 18 + Vite |
| Styling | Plain CSS |
| Tracking | Standalone `tracker.js` |

---

## Prerequisites

- **Node.js** ≥ 18 (for `crypto.randomUUID` and `--watch`)
- **MongoDB** ≥ 6 running locally on port `27017`, or any MongoDB connection string

---

## MongoDB Configuration

1. Install and start MongoDB Community Server: https://www.mongodb.com/try/download/community
2. The default connection string is `mongodb://localhost:27017`.
3. The database `interaction_tracker` and collection `events` are created automatically on first run.

---

## Installation

```bash
# Install server dependencies
cd interaction-tracker/server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## Environment Setup

Copy `.env.example` to `.env` in the `server/` directory and adjust if needed:

```bash
cd interaction-tracker/server
copy .env.example .env
```

`.env` defaults:
```
MONGODB_URI=mongodb://localhost:27017
DB_NAME=interaction_tracker
PORT=5000
```

---

## Running the Application

Open **two terminal windows**.

**Terminal 1 — Backend:**
```bash
cd interaction-tracker/server
npm start
```

Expected output:
```
[db] Connected to MongoDB: interaction_tracker
[server] Listening on http://localhost:5000
[server] Tracker script available at http://localhost:5000/tracker.js
```

**Terminal 2 — Frontend:**
```bash
cd interaction-tracker/client
npm run dev
```

Expected output:
```
  VITE ready in ...ms
  ➜  Local:   http://localhost:5173/
```

---

## Demo Page

Open the demo page to generate tracking data:

```
http://localhost:5000/demo.html
```

Or navigate to it from within the dashboard via the **Demo Page ↗** link in the nav bar.

Click around on the demo page, then refresh the dashboard to see your session and events.

---

## Dashboard

Open the React dashboard:

```
http://localhost:5173
```

- **Sessions tab** — lists all sessions; click any row to open the event timeline
- **Heatmap tab** — select a page URL to visualise click positions

---

## API Endpoints

All endpoints return `Content-Type: application/json`.

### `GET /api/health`
```json
{ "status": "OK" }
```

### `POST /api/events`
Record a tracking event.

**Request body:**
```json
{
  "session_id": "uuid",
  "event_type": "page_view | click",
  "page_url": "https://example.com",
  "timestamp": "2026-10-12T10:30:00.000Z",
  "click_x": 250,
  "click_y": 400,
  "viewport_width": 1440,
  "viewport_height": 900
}
```

**Response:** `201 Created`
```json
{ "success": true, "id": "<mongodb-object-id>" }
```

### `GET /api/sessions`
Return all sessions with aggregated counts.

**Response:** `200 OK`
```json
{
  "sessions": [
    {
      "session_id": "uuid",
      "total_events": 12,
      "page_views": 3,
      "clicks": 9,
      "first_activity": "2026-10-12T10:00:00.000Z",
      "last_activity": "2026-10-12T10:15:00.000Z"
    }
  ]
}
```

### `GET /api/sessions/:sessionId/events`
Return events for a session in chronological order.

**Response:** `200 OK`
```json
{
  "session_id": "uuid",
  "events": [
    {
      "event_type": "page_view",
      "page_url": "http://localhost:5000/demo.html",
      "timestamp": "2026-10-12T10:00:00.000Z",
      "click_x": null,
      "click_y": null
    }
  ]
}
```

### `GET /api/heatmap?url=<encoded-url>`
Return click events for a specific page URL.

**Response:** `200 OK`
```json
{
  "page_url": "http://localhost:5000/demo.html",
  "total_clicks": 5,
  "clicks": [
    { "click_x": 320, "click_y": 240, "viewport_width": 1440, "viewport_height": 900 }
  ]
}
```

### `GET /tracker.js`
Serve the tracking script as plain JavaScript (no authentication required).

---

## Testing the Tracker

1. Start both backend and frontend.
2. Open `http://localhost:5000/demo.html`.
3. Verify in the browser console that no errors appear.
4. Click several buttons and links on the demo page.
5. Open `http://localhost:5173` and check the Sessions tab — your session should appear.
6. Click the session row to see the event timeline.
7. Go to the Heatmap tab and select the demo page URL to see click positions.
8. Reload the demo page — the session ID should remain the same (stored in `localStorage`).

---

## Project Structure

```
interaction-tracker/
├── client/
│   ├── public/
│   │   ├── demo.html          # Demo page with tracker included
│   │   └── tracker.js         # Standalone tracking script
│   ├── src/
│   │   ├── components/
│   │   │   ├── ErrorBox.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── utils.js
│   │   ├── pages/
│   │   │   ├── SessionsPage.jsx
│   │   │   └── HeatmapPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── routes/
│   │   └── api.js             # Route handler functions
│   ├── db.js                  # MongoDB connection module
│   ├── helpers.js             # CORS, JSON parsing, response helpers
│   ├── validation.js          # Event validation & sanitisation
│   ├── server.js              # HTTP server entry point
│   ├── .env                   # Environment variables (not committed)
│   ├── .env.example           # Template for .env
│   └── package.json
├── .gitignore
└── README.md
```

---

## Heatmap Limitations

- The heatmap uses the first recorded `viewport_width` and `viewport_height` from the selected page's click events as the reference viewport. If users with different screen sizes visit the page, coordinates from different viewports are scaled using a single reference, which may place dots slightly off.
- The preview is a plain grey rectangle — it does not render the actual webpage.
- `clientX` / `clientY` capture position relative to the visible viewport, not the full document. Coordinates may not align if the user had scrolled down.

---

## Known Requirements

- MongoDB must be running before starting the server. If MongoDB is unavailable the server exits with a clear error message.
- The tracker script uses `fetch()` which requires a modern browser (Chrome 42+, Firefox 39+, Edge 14+, Safari 10.1+).
