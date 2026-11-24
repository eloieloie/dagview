"""Tiny SQLite-backed run history store (no extra deps — stdlib sqlite3)."""
import sqlite3
import time
import json
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path("/app/data/dagview_runs.db")


def _connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS runs (
            id TEXT PRIMARY KEY,
            command TEXT NOT NULL,
            select_arg TEXT,
            status TEXT NOT NULL,
            started_at REAL NOT NULL,
            finished_at REAL,
            log_path TEXT NOT NULL,
            exit_code INTEGER
        )
        """
    )
    conn.commit()
    return conn


_conn = _connect()


@contextmanager
def lock():
    yield _conn


def create_run(run_id: str, command: str, select_arg: str | None, log_path: str):
    with lock() as conn:
        conn.execute(
            "INSERT INTO runs (id, command, select_arg, status, started_at, log_path) VALUES (?, ?, ?, 'running', ?, ?)",
            (run_id, command, select_arg, time.time(), log_path),
        )
        conn.commit()


def finish_run(run_id: str, status: str, exit_code: int):
    with lock() as conn:
        conn.execute(
            "UPDATE runs SET status = ?, finished_at = ?, exit_code = ? WHERE id = ?",
            (status, time.time(), exit_code, run_id),
        )
        conn.commit()


def list_runs(limit: int = 50):
    with lock() as conn:
        cur = conn.execute(
            "SELECT id, command, select_arg, status, started_at, finished_at, exit_code FROM runs ORDER BY started_at DESC LIMIT ?",
            (limit,),
        )
        rows = cur.fetchall()
    return [
        {
            "id": r[0],
            "command": r[1],
            "select": r[2],
            "status": r[3],
            "started_at": r[4],
            "finished_at": r[5],
            "exit_code": r[6],
            "duration_s": (r[5] - r[4]) if r[5] else None,
        }
        for r in rows
    ]


def get_run(run_id: str):
    with lock() as conn:
        cur = conn.execute(
            "SELECT id, command, select_arg, status, started_at, finished_at, log_path, exit_code FROM runs WHERE id = ?",
            (run_id,),
        )
        r = cur.fetchone()
    if not r:
        return None
    return {
        "id": r[0],
        "command": r[1],
        "select": r[2],
        "status": r[3],
        "started_at": r[4],
        "finished_at": r[5],
        "log_path": r[6],
        "exit_code": r[7],
        "duration_s": (r[5] - r[4]) if r[5] else None,
    }
