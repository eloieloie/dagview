import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

export default function RunTrigger({ defaultSelect = '' }) {
  const [command, setCommand] = useState('build')
  const [select, setSelect] = useState(defaultSelect)
  const [fullRefresh, setFullRefresh] = useState(false)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function trigger() {
    setBusy(true)
    try {
      const res = await api.triggerRun({
        command,
        select: select || null,
        full_refresh: fullRefresh,
      })
      navigate(`/runs/${res.id}`)
    } catch (e) {
      alert('Failed to trigger run: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <div className="section-title">Trigger a Job</div>
      <div className="flex gap-12" style={{ marginBottom: 10 }}>
        <select className="pill-input" style={{ width: 160 }} value={command} onChange={e => setCommand(e.target.value)}>
          <option value="build">build</option>
          <option value="run">run</option>
          <option value="test">test</option>
          <option value="seed">seed</option>
          <option value="compile">compile</option>
          <option value="docs generate">docs generate</option>
        </select>
        <input
          className="pill-input"
          placeholder="--select (optional, e.g. fct_orders+)"
          value={select}
          onChange={e => setSelect(e.target.value)}
        />
      </div>
      <div className="flex gap-12 align-center justify-between">
        <label className="flex gap-8 align-center" style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          <input type="checkbox" checked={fullRefresh} onChange={e => setFullRefresh(e.target.checked)} />
          Full refresh
        </label>
        <button className="btn" disabled={busy} onClick={trigger}>
          {busy ? 'Starting…' : '▶ Run'}
        </button>
      </div>
    </div>
  )
}
