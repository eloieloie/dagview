import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import RunTrigger from '../components/RunTrigger.jsx'

function fmtTime(ts) {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString()
}
function fmtDuration(s) {
  if (s == null) return '—'
  return `${s.toFixed(1)}s`
}

export default function Runs() {
  const [runs, setRuns] = useState([])
  const navigate = useNavigate()

  async function refresh() {
    try { setRuns(await api.listRuns()) } catch {}
  }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <div className="topbar">
        <h1>Run History</h1>
      </div>
      <div className="content">
        <div style={{ maxWidth: 480, marginBottom: 20 }}>
          <RunTrigger />
        </div>
        <div className="card">
          <table>
            <thead>
              <tr><th>Command</th><th>Select</th><th>Status</th><th>Started</th><th>Duration</th></tr>
            </thead>
            <tbody>
              {runs.map(r => (
                <tr key={r.id} className="model-row" onClick={() => navigate(`/runs/${r.id}`)}>
                  <td>dbt {r.command}</td>
                  <td style={{ color: 'var(--text-dim)' }}>{r.select || '—'}</td>
                  <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                  <td>{fmtTime(r.started_at)}</td>
                  <td>{fmtDuration(r.duration_s)}</td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr><td colSpan={5} className="empty-state">No runs yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
