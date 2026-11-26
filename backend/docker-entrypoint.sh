#!/bin/sh
# Runs once at container startup, on the real (cluster) network, so dbt can
# reach the Airbyte-fed Postgres landing zone (dagview_raw on
# airbyte-db-svc.airbyte.svc.cluster.local) that the sqlite-sourced models
# read from. This used to run at `docker build` time, which only has the
# Docker daemon's host network and can't resolve in-cluster service DNS.
set -e

cd /app/dbt_project

echo "[entrypoint] seeding dbt project..."
dbt seed --project-dir /app/dbt_project --profiles-dir /app/dbt_project || \
  echo "[entrypoint] WARNING: dbt seed failed, continuing (app can retry via API)"

echo "[entrypoint] running dbt models..."
dbt run --project-dir /app/dbt_project --profiles-dir /app/dbt_project || \
  echo "[entrypoint] WARNING: dbt run failed, continuing (app can retry via API)"

echo "[entrypoint] testing dbt models..."
dbt test --project-dir /app/dbt_project --profiles-dir /app/dbt_project || \
  echo "[entrypoint] WARNING: dbt test had failures, continuing"

echo "[entrypoint] generating dbt docs..."
dbt docs generate --project-dir /app/dbt_project --profiles-dir /app/dbt_project || \
  echo "[entrypoint] WARNING: dbt docs generate failed, continuing"

echo "[entrypoint] initial dbt build complete, starting app..."
cd /app
exec "$@"
