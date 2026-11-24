"""Parse dbt's manifest.json / catalog.json / run_results.json into
simple structures the frontend can consume for lineage, model explorer,
and docs."""
import json
from pathlib import Path

TARGET_DIR = Path("/app/dbt_project/target")


def _load(name: str):
    p = TARGET_DIR / name
    if not p.exists():
        return None
    with open(p) as f:
        return json.load(f)


def get_lineage():
    manifest = _load("manifest.json")
    if not manifest:
        return {"nodes": [], "edges": []}

    nodes = []
    edges = []
    all_nodes = {**manifest.get("nodes", {}), **manifest.get("sources", {})}

    for unique_id, node in all_nodes.items():
        resource_type = node.get("resource_type")
        if resource_type not in ("model", "seed", "source"):
            continue
        nodes.append(
            {
                "id": unique_id,
                "name": node.get("name"),
                "resource_type": resource_type,
                "materialized": node.get("config", {}).get("materialized"),
                "description": node.get("description") or "",
                "schema": node.get("schema"),
                "tags": node.get("tags", []),
            }
        )

    for unique_id, node in manifest.get("nodes", {}).items():
        for dep in node.get("depends_on", {}).get("nodes", []):
            edges.append({"source": dep, "target": unique_id})

    return {"nodes": nodes, "edges": edges}


def get_models():
    manifest = _load("manifest.json")
    if not manifest:
        return []
    out = []
    for unique_id, node in manifest.get("nodes", {}).items():
        if node.get("resource_type") not in ("model", "seed"):
            continue
        out.append(
            {
                "id": unique_id,
                "name": node.get("name"),
                "resource_type": node.get("resource_type"),
                "materialized": node.get("config", {}).get("materialized"),
                "description": node.get("description") or "",
                "path": node.get("original_file_path"),
                "columns": list(node.get("columns", {}).keys()),
                "tags": node.get("tags", []),
            }
        )
    return sorted(out, key=lambda m: (m["resource_type"], m["name"]))


def get_model_detail(unique_id: str):
    manifest = _load("manifest.json")
    catalog = _load("catalog.json")
    if not manifest:
        return None

    node = manifest.get("nodes", {}).get(unique_id) or manifest.get("sources", {}).get(unique_id)
    if not node:
        return None

    columns = node.get("columns", {})
    catalog_cols = {}
    if catalog:
        cat_node = catalog.get("nodes", {}).get(unique_id)
        if cat_node:
            catalog_cols = cat_node.get("columns", {})

    col_list = []
    seen = set()
    for col_name, col_meta in columns.items():
        seen.add(col_name.lower())
        cat_info = catalog_cols.get(col_name) or catalog_cols.get(col_name.upper()) or {}
        col_list.append(
            {
                "name": col_name,
                "description": col_meta.get("description", ""),
                "data_type": cat_info.get("type", col_meta.get("data_type") or ""),
            }
        )
    for col_name, cat_info in catalog_cols.items():
        if col_name.lower() not in seen:
            col_list.append({"name": col_name, "description": "", "data_type": cat_info.get("type", "")})

    return {
        "id": unique_id,
        "name": node.get("name"),
        "resource_type": node.get("resource_type"),
        "materialized": node.get("config", {}).get("materialized"),
        "description": node.get("description") or "",
        "raw_code": node.get("raw_code", ""),
        "compiled_code": node.get("compiled_code", ""),
        "database": node.get("database"),
        "schema": node.get("schema"),
        "alias": node.get("alias") or node.get("name"),
        "tags": node.get("tags", []),
        "depends_on": node.get("depends_on", {}).get("nodes", []),
        "columns": col_list,
    }


def get_run_results_summary():
    rr = _load("run_results.json")
    if not rr:
        return None
    results = []
    for r in rr.get("results", []):
        results.append(
            {
                "unique_id": r.get("unique_id"),
                "status": r.get("status"),
                "execution_time": r.get("execution_time"),
                "message": r.get("message"),
            }
        )
    return {"generated_at": rr.get("metadata", {}).get("generated_at"), "results": results}
