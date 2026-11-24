import { useState } from 'react'
import { api } from '../api.js'

export default function SqlEditor() {
  const [sql, setSql] = useState('select * from main_marts.dim_customers order by lifetime_value desc')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    setError(null)
    try {
      const res = await api.sqlPreview(sql, 200)
      setResult(res)
    } catch (e) {
      setError(e.message)
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="topbar">
        <h1>SQL Editor (read-only preview)</h1>
      </div>
      <div className="content">
        <div className="card">
          <textarea
            className="pill-input"
            style={{ height: 120, fontFamily: 'monospace', resize: 'vertical' }}
            value={sql}
            onChange={e => setSql(e.target.value)}
          />
          <div style={{ marginTop: 10 }}>
            <button className="btn" disabled={busy} onClick={run}>{busy ? 'Running…' : '▶ Preview'}</button>
          </div>
        </div>

        {error && <div className="card" style={{ color: 'var(--red)' }}>{error}</div>}

        {result && (
          <div className="card">
            <div className="section-title">{result.rows.length} rows</div>
            <div style={{ overflow: 'auto' }}>
              <table>
                <thead>
                  <tr>{result.columns.map(c => <th key={c}>{c}</th>)}</tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => <td key={j}>{String(cell)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
