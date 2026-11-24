import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api.js'

export default function RunDetail() {
  const { id } = useParams()
  const [run, setRun] = useState(null)
  const [lines, setLines] = useState([])
  const consoleRef = useRef(null)
  const esRef = useRef(null)

  useEffect(() => {
    setLines([])
    api.getRun(id).then(setRun).catch(() => {})
    api.getLog(id).then(d => setLines(d.lines.map(l => l.trimEnd()))).catch(() => {})

    const es = new EventSource(api.streamUrl(id))
    esRef.current = es
    es.onmessage = (ev) => {
      const data = JSON.parse(ev.data)
      if (data.line !== undefined) {
        setLines(prev => [...prev, data.line])
      }
      if (data.done) {
        api.getRun(id).then(setRun).catch(() => {})
        es.close()
      }
    }
    es.onerror = () => es.close()
    return () => es.close()
  }, [id])

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [lines])

  function lineClass(line) {
    const l = line.toLowerCase()
    if (l.includes('error') || l.includes('fail')) return 'line error'
    if (l.includes('ok created') || l.includes('pass') || l.includes('completed successfully')) return 'line ok'
    return 'line'
  }

  return (
    <>
      <div className="topbar">
        <h1>Run {id}</h1>
        <Link to="/runs" className="btn secondary">← All runs</Link>
      </div>
      <div className="content">
        {run && (
          <div className="card flex justify-between align-center">
            <div>
              <strong>dbt {run.command}</strong>{run.select ? ` --select ${run.select}` : ''}
            </div>
            <span className={`badge ${run.status}`}>{run.status}</span>
          </div>
        )}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-title">Live Log</div>
          <div className="log-console" ref={consoleRef}>
            {lines.map((l, i) => (
              <div key={i} className={lineClass(l)}>{l || '\u00A0'}</div>
            ))}
            {lines.length === 0 && <div style={{ color: 'var(--text-dim)' }}>Waiting for output…</div>}
          </div>
        </div>
      </div>
    </>
  )
}
