import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api.js'
import RunTrigger from '../components/RunTrigger.jsx'

export default function ModelDetail() {
  const { id } = useParams()
  const [model, setModel] = useState(null)
  const [tab, setTab] = useState('raw')
  const [error, setError] = useState(null)

  useEffect(() => {
    setModel(null)
    setError(null)
    api.modelDetail(id).then(setModel).catch(e => setError(e.message))
  }, [id])

  if (error) return (
    <div className="content"><div className="card empty-state">{error}</div></div>
  )
  if (!model) return <div className="content"><div className="card">Loading…</div></div>

  return (
    <>
      <div className="topbar">
        <h1>{model.name}</h1>
        <Link to="/models" className="btn secondary">← Back to models</Link>
      </div>
      <div className="content">
        <div className="grid cols-2" style={{ marginBottom: 16 }}>
          <div className="card">
            <div className="section-title">Details</div>
            <table>
              <tbody>
                <tr><td>Type</td><td><span className={`badge ${model.resource_type}`}>{model.resource_type}</span></td></tr>
                <tr><td>Materialization</td><td>{model.materialized || '—'}</td></tr>
                <tr><td>Database.Schema.Alias</td><td>{model.database}.{model.schema}.{model.alias}</td></tr>
                <tr><td>Tags</td><td>{model.tags?.join(', ') || '—'}</td></tr>
                <tr><td>Description</td><td>{model.description || '—'}</td></tr>
              </tbody>
            </table>
          </div>
          <RunTrigger defaultSelect={model.name} />
        </div>

        <div className="card">
          <div className="section-title">Columns</div>
          <table>
            <thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead>
            <tbody>
              {model.columns.map(c => (
                <tr key={c.name}>
                  <td>{c.name}</td>
                  <td style={{ color: 'var(--text-dim)' }}>{c.data_type || '—'}</td>
                  <td style={{ color: 'var(--text-dim)' }}>{c.description || '—'}</td>
                </tr>
              ))}
              {model.columns.length === 0 && (
                <tr><td colSpan={3} className="empty-state">No column metadata yet — run `dbt docs generate`.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="tabs">
            <div className={`tab ${tab === 'raw' ? 'active' : ''}`} onClick={() => setTab('raw')}>Raw SQL</div>
            <div className={`tab ${tab === 'compiled' ? 'active' : ''}`} onClick={() => setTab('compiled')}>Compiled SQL</div>
          </div>
          <div className="code-block">
            {tab === 'raw' ? (model.raw_code || '-- no raw code available') : (model.compiled_code || '-- not compiled yet, trigger a run/compile')}
          </div>
        </div>
      </div>
    </>
  )
}
