import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import RunTrigger from '../components/RunTrigger.jsx'

export default function Overview() {
  const [models, setModels] = useState([])
  const [runs, setRuns] = useState([])
  const [tables, setTables] = useState([])

  useEffect(() => {
    api.models().then(setModels).catch(() => {})
    api.listRuns().then(setRuns).catch(() => {})
    api.tables().then(setTables).catch(() => {})
  }, [])

  const modelCount = models.filter(m => m.resource_type === 'model').length
  const seedCount = models.filter(m => m.resource_type === 'seed').length
  const lastRun = runs[0]
  const successCount = runs.filter(r => r.status === 'success').length

  return (
    <>
      <div className="topbar">
        <h1>Project Overview</h1>
      </div>
      <div className="content">
        <div className="grid cols-4" style={{ marginBottom: 20 }}>
          <div className="card stat">
            <div className="label">Models</div>
            <div className="value">{modelCount}</div>
          </div>
          <div className="card stat">
            <div className="label">Seeds</div>
            <div className="value">{seedCount}</div>
          </div>
          <div className="card stat">
            <div className="label">Materialized Tables</div>
            <div className="value">{tables.length}</div>
          </div>
          <div className="card stat">
            <div className="label">Successful Runs</div>
            <div className="value">{successCount} / {runs.length}</div>
          </div>
        </div>

        <div className="grid cols-2">
          <div>
            <RunTrigger />
          </div>
          <div className="card">
            <div className="section-title">Last Run</div>
            {lastRun ? (
              <>
                <div className="flex justify-between" style={{ marginBottom: 8 }}>
                  <span>dbt {lastRun.command}{lastRun.select ? ` --select ${lastRun.select}` : ''}</span>
                  <span className={`badge ${lastRun.status}`}>{lastRun.status}</span>
                </div>
                <Link to={`/runs/${lastRun.id}`} className="btn secondary" style={{ display: 'inline-block' }}>
                  View logs →
                </Link>
              </>
            ) : (
              <div className="empty-state">No runs yet. Trigger one on the left.</div>
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="flex justify-between align-center" style={{ marginBottom: 10 }}>
            <div className="section-title" style={{ margin: 0 }}>Recent Models</div>
            <Link to="/models" className="btn secondary">View all →</Link>
          </div>
          <table>
            <thead>
              <tr><th>Name</th><th>Type</th><th>Materialization</th><th>Description</th></tr>
            </thead>
            <tbody>
              {models.slice(0, 6).map(m => (
                <tr key={m.id} className="model-row" onClick={() => window.location.hash = `#/models/${encodeURIComponent(m.id)}`}>
                  <td>{m.name}</td>
                  <td><span className={`badge ${m.resource_type}`}>{m.resource_type}</span></td>
                  <td>{m.materialized || '—'}</td>
                  <td style={{ color: 'var(--text-dim)' }}>{m.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
