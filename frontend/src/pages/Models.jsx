import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

export default function Models() {
  const [models, setModels] = useState([])
  const [filter, setFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.models().then(setModels).catch(() => {})
  }, [])

  const filtered = models.filter(m =>
    m.name.toLowerCase().includes(filter.toLowerCase()) ||
    (m.description || '').toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <>
      <div className="topbar">
        <h1>Models</h1>
      </div>
      <div className="content">
        <input
          className="pill-input"
          style={{ maxWidth: 320, marginBottom: 16 }}
          placeholder="Filter models…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <div className="card">
          <table>
            <thead>
              <tr><th>Name</th><th>Type</th><th>Materialization</th><th>Columns</th><th>Description</th></tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="model-row" onClick={() => navigate(`/models/${encodeURIComponent(m.id)}`)}>
                  <td>{m.name}</td>
                  <td><span className={`badge ${m.resource_type}`}>{m.resource_type}</span></td>
                  <td>{m.materialized || '—'}</td>
                  <td style={{ color: 'var(--text-dim)' }}>{m.columns.length}</td>
                  <td style={{ color: 'var(--text-dim)' }}>{m.description || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="empty-state">
                  No models found. Run <code>dbt docs generate</code> (or trigger a build) to populate the manifest.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
