import { Routes, Route, NavLink } from 'react-router-dom'
import Overview from './pages/Overview.jsx'
import Lineage from './pages/Lineage.jsx'
import Models from './pages/Models.jsx'
import ModelDetail from './pages/ModelDetail.jsx'
import Runs from './pages/Runs.jsx'
import RunDetail from './pages/RunDetail.jsx'
import SqlEditor from './pages/SqlEditor.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">dv</div>
          <div>
            <div className="name">dagview</div>
            <div className="sub">dbt Core control plane</div>
          </div>
        </div>
        <nav>
          <NavLink to="/" end className={({isActive}) => 'navlink' + (isActive ? ' active' : '')}>🏠 Overview</NavLink>
          <NavLink to="/lineage" className={({isActive}) => 'navlink' + (isActive ? ' active' : '')}>🕸️ Lineage (DAG)</NavLink>
          <NavLink to="/models" className={({isActive}) => 'navlink' + (isActive ? ' active' : '')}>📦 Models</NavLink>
          <NavLink to="/runs" className={({isActive}) => 'navlink' + (isActive ? ' active' : '')}>▶️ Runs</NavLink>
          <NavLink to="/sql" className={({isActive}) => 'navlink' + (isActive ? ' active' : '')}>🧮 SQL Editor</NavLink>
          <a href="/docs/index.html" target="_blank" rel="noreferrer" className="navlink">📚 dbt Docs</a>
        </nav>
      </aside>
      <div className="main">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/lineage" element={<Lineage />} />
          <Route path="/models" element={<Models />} />
          <Route path="/models/:id" element={<ModelDetail />} />
          <Route path="/runs" element={<Runs />} />
          <Route path="/runs/:id" element={<RunDetail />} />
          <Route path="/sql" element={<SqlEditor />} />
        </Routes>
      </div>
    </div>
  )
}
