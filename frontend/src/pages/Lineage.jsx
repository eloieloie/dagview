import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import 'reactflow/dist/style.css'
import { api } from '../api.js'

function layout(nodes, edges) {
  // simple layered layout: compute depth via longest-path from roots
  const depById = {}
  edges.forEach(e => {
    depById[e.target] = depById[e.target] || []
    depById[e.target].push(e.source)
  })
  const depth = {}
  function getDepth(id, seen = new Set()) {
    if (depth[id] !== undefined) return depth[id]
    if (seen.has(id)) return 0
    seen.add(id)
    const parents = depById[id] || []
    if (parents.length === 0) { depth[id] = 0; return 0 }
    const d = 1 + Math.max(...parents.map(p => getDepth(p, seen)))
    depth[id] = d
    return d
  }
  nodes.forEach(n => getDepth(n.id))

  const byDepth = {}
  nodes.forEach(n => {
    const d = depth[n.id] || 0
    byDepth[d] = byDepth[d] || []
    byDepth[d].push(n)
  })

  const rfNodes = []
  Object.keys(byDepth).sort((a, b) => a - b).forEach(d => {
    byDepth[d].forEach((n, i) => {
      rfNodes.push({
        id: n.id,
        data: { label: n.name, node: n },
        position: { x: Number(d) * 260, y: i * 90 },
        className: n.resource_type,
        style: { width: 180 },
      })
    })
  })

  const rfEdges = edges.map((e, i) => ({
    id: `e${i}`,
    source: e.source,
    target: e.target,
    animated: false,
    style: { stroke: '#4a5160' },
  }))

  return { rfNodes, rfEdges }
}

export default function Lineage() {
  const [lineage, setLineage] = useState({ nodes: [], edges: [] })
  const navigate = useNavigate()

  useEffect(() => {
    api.lineage().then(setLineage).catch(() => {})
  }, [])

  const { rfNodes, rfEdges } = useMemo(() => layout(lineage.nodes, lineage.edges), [lineage])

  const onNodeClick = useCallback((_, node) => {
    if (node.data.node.resource_type !== 'source') {
      navigate(`/models/${encodeURIComponent(node.id)}`)
    }
  }, [navigate])

  return (
    <>
      <div className="topbar">
        <h1>Lineage (DAG)</h1>
      </div>
      <div className="content" style={{ padding: 0 }}>
        <div style={{ height: 'calc(100vh - 52px)', background: '#0f1115' }}>
          {rfNodes.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 80 }}>
              No lineage data yet. Trigger a <code>dbt build</code> or <code>docs generate</code> run to populate it.
            </div>
          ) : (
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              onNodeClick={onNodeClick}
              fitView
              nodesDraggable={true}
              nodesConnectable={false}
            >
              <Background color="#2a2f3a" gap={20} />
              <Controls />
              <MiniMap style={{ background: '#171a21' }} maskColor="rgba(15,17,21,0.6)" />
            </ReactFlow>
          )}
        </div>
      </div>
    </>
  )
}
