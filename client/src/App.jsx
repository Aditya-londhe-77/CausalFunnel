import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import SessionsPage from './pages/SessionsPage';
import HeatmapPage from './pages/HeatmapPage';

export default function App() {
  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-brand">
          <span className="nav-dot" />
          Interaction Tracker
        </div>
        <div className="nav-links">
          <NavLink to="/sessions" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Sessions
          </NavLink>
          <NavLink to="/heatmap" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Heatmap
          </NavLink>
          <a
            href="http://localhost:5000/demo.html"
            className="nav-link nav-link-external"
            target="_blank"
            rel="noreferrer"
          >
            Demo Page ↗
          </a>
        </div>
      </nav>

      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/sessions" replace />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/heatmap" element={<HeatmapPage />} />
        </Routes>
      </main>

      <footer className="footer">
        Interaction Tracker &mdash; Pure Node.js + React + MongoDB
      </footer>
    </div>
  );
}
