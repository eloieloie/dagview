"""dagview backend — a small dbt-Cloud-style control plane for a dbt-core project.

Features (mirroring dbt Cloud's core workflow):
  - Project overview / model explorer (parsed from manifest.json)
  - Lineage graph (DAG) data for the frontend to render
  - Trigger dbt commands (run, build, test, seed, docs generate) as async jobs
  - Live-tail logs for a running job (SSE)
  - Run history (persisted in sqlite)
  - Model detail: compiled SQL, raw SQL, columns, docs
  - Ad-hoc SQL preview against the DuckDB warehouse (read-only)
  - Serves dbt's own generated docs site (static) under /docs
"""
import asyncio
import json
import os
import subprocess
import time
import uuid
from pathlib import Path
from typing import Optional

import duckdb
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import db
import manifest_utils

DBT_PROJECT_DIR = Path("/app/dbt_project")
LOG_DIR = Path("/app/data/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)
DUCKDB_PATH = "/app/data/dagview.duckdb"

app = FastAPI(title="dagview", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory registry of running/completed job processes for this process lifetime
_jobs: dict[str, dict] = {}


class RunRequest(BaseModel):
    command: str  # run | build | test | seed | compile | "docs generate"
    select: Optional[str] = None
    full_refresh: bool = False


class SqlPreviewRequest(BaseModel):
    sql: str
    limit: int = 100


def _dbt_base_args():
    return [
        "dbt",
        "--no-use-colors",
        "--log-format",
        "json",
    ]


def _build_command_args(req: RunRequest):
    args = _dbt_base_args() + req.command.split()
    if req.select:
        args += ["--select", req.select]
    if req.full_refresh and req.command in ("run", "build"):
        args += ["--full-refresh"]
    args += ["--project-dir", str(DBT_PROJECT_DIR), "--profiles-dir", str(DBT_PROJECT_DIR)]
    return args


async def _run_job(run_id: str, args: list[str]):
    log_path = LOG_DIR / f"{run_id}.log"
    _jobs[run_id]["log_path"] = str(log_path)
    with open(log_path, "wb") as logf:
        proc = await asyncio.create_subprocess_exec(
            *args,
            cwd=str(DBT_PROJECT_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            env={**os.environ, "DBT_PROFILES_DIR": str(DBT_PROJECT_DIR)},
        )
        _jobs[run_id]["proc"] = proc
        assert proc.stdout is not None
        while True:
            line = await proc.stdout.readline()
            if not line:
                break
            logf.write(line)
            logf.flush()
            _jobs[run_id]["lines"].append(line.decode(errors="replace"))
        exit_code = await proc.wait()
    status = "success" if exit_code == 0 else "failed"
    _jobs[run_id]["status"] = status
    _jobs[run_id]["exit_code"] = exit_code
    db.finish_run(run_id, status, exit_code)


@app.get("/api/health")
def health():
    return {"status": "ok", "time": time.time()}


@app.get("/api/models")
def api_models():
    return manifest_utils.get_models()


@app.get("/api/models/{unique_id:path}")
def api_model_detail(unique_id: str):
    detail = manifest_utils.get_model_detail(unique_id)
    if not detail:
        raise HTTPException(404, "model not found — run a dbt command first to generate the manifest")
    return detail


@app.get("/api/lineage")
def api_lineage():
    return manifest_utils.get_lineage()


@app.get("/api/run-results")
def api_run_results():
    res = manifest_utils.get_run_results_summary()
    if res is None:
        return {"generated_at": None, "results": []}
    return res


@app.post("/api/runs")
async def api_trigger_run(req: RunRequest):
    allowed = {"run", "build", "test", "seed", "compile", "docs generate", "debug"}
    if req.command not in allowed:
        raise HTTPException(400, f"command must be one of {sorted(allowed)}")

    run_id = uuid.uuid4().hex[:12]
    args = _build_command_args(req)
    log_path = LOG_DIR / f"{run_id}.log"
    db.create_run(run_id, req.command, req.select, str(log_path))
    _jobs[run_id] = {"status": "running", "lines": [], "exit_code": None, "log_path": str(log_path)}

    asyncio.create_task(_run_job(run_id, args))
    return {"id": run_id, "status": "running", "command": req.command, "select": req.select}


@app.get("/api/runs")
def api_list_runs(limit: int = 50):
    return db.list_runs(limit)


@app.get("/api/runs/{run_id}")
def api_get_run(run_id: str):
    run = db.get_run(run_id)
    if not run:
        raise HTTPException(404, "run not found")
    return run


@app.get("/api/runs/{run_id}/log")
def api_get_log(run_id: str):
    run = db.get_run(run_id)
    if not run:
        raise HTTPException(404, "run not found")
    log_path = Path(run["log_path"])
    if not log_path.exists():
        return {"lines": []}
    with open(log_path, "r", errors="replace") as f:
        lines = f.readlines()
    return {"lines": lines}


@app.get("/api/runs/{run_id}/stream")
async def api_stream_log(run_id: str):
    """Server-Sent Events live tail of a run's log, dbt-Cloud-run-page style."""
    run = db.get_run(run_id)
    if not run:
        raise HTTPException(404, "run not found")
    log_path = Path(run["log_path"])

    async def event_gen():
        sent = 0
        while True:
            if log_path.exists():
                with open(log_path, "r", errors="replace") as f:
                    f.seek(sent)
                    chunk = f.read()
                    if chunk:
                        sent += len(chunk.encode(errors="replace"))
                        for line in chunk.splitlines():
                            yield f"data: {json.dumps({'line': line})}\n\n"
            current = db.get_run(run_id)
            if current and current["status"] != "running":
                yield f"data: {json.dumps({'done': True, 'status': current['status'], 'exit_code': current['exit_code']})}\n\n"
                break
            await asyncio.sleep(0.5)

    return StreamingResponse(event_gen(), media_type="text/event-stream")


@app.post("/api/sql-preview")
def api_sql_preview(req: SqlPreviewRequest):
    sql = req.sql.strip().rstrip(";")
    lowered = sql.lower()
    forbidden = ("insert", "update", "delete", "drop", "create", "alter", "attach", "copy", "pragma")
    if any(lowered.startswith(kw) for kw in forbidden):
        raise HTTPException(400, "only read-only SELECT queries are allowed in the preview")
    try:
        con = duckdb.connect(DUCKDB_PATH, read_only=True)
        result = con.execute(f"{sql} LIMIT {min(req.limit, 500)}")
        cols = [d[0] for d in result.description]
        rows = result.fetchall()
        con.close()
    except Exception as e:
        raise HTTPException(400, str(e))
    return {"columns": cols, "rows": [list(r) for r in rows]}


@app.get("/api/tables")
def api_tables():
    """List tables/views currently materialized in the warehouse."""
    if not Path(DUCKDB_PATH).exists():
        return []
    con = duckdb.connect(DUCKDB_PATH, read_only=True)
    rows = con.execute(
        "select table_schema, table_name, table_type from information_schema.tables order by 1,2"
    ).fetchall()
    con.close()
    return [{"schema": r[0], "name": r[1], "type": r[2]} for r in rows]


# Serve dbt's generated static docs site (dbt docs generate output) at /docs
docs_dir = DBT_PROJECT_DIR / "target"
if docs_dir.exists():
    app.mount("/docs", StaticFiles(directory=str(docs_dir), html=True), name="dbt-docs")


# Serve the frontend SPA
FRONTEND_DIR = Path("/app/frontend_dist")
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
