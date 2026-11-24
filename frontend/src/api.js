// Use the app's own mount path (Vite's configured `base`, e.g. '/dagview/')
// so API calls still hit this app's backend when served from a subpath
// behind a reverse proxy, instead of resolving to the site root.
const BASE = (import.meta.env.BASE_URL.replace(/\/$/, '')) + '/api'

async function j(path, opts) {
  const res = await fetch(BASE + path, opts)
  if (!res.ok) {
    let msg = res.statusText
    try { msg = (await res.json()).detail || msg } catch {}
    throw new Error(msg)
  }
  return res.json()
}

export const api = {
  health: () => j('/health'),
  models: () => j('/models'),
  modelDetail: (id) => j(`/models/${encodeURIComponent(id)}`),
  lineage: () => j('/lineage'),
  runResults: () => j('/run-results'),
  tables: () => j('/tables'),
  listRuns: () => j('/runs'),
  getRun: (id) => j(`/runs/${id}`),
  getLog: (id) => j(`/runs/${id}/log`),
  triggerRun: (body) => j('/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }),
  sqlPreview: (sql, limit = 100) => j('/sql-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, limit }),
  }),
  streamUrl: (id) => `${BASE}/runs/${id}/stream`,
}
