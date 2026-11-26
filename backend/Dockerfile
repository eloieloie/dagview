FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --use-pep517 -r /app/requirements.txt

COPY backend/ /app/
COPY dbt_project/ /app/dbt_project/
COPY frontend_dist/ /app/frontend_dist/

RUN mkdir -p /app/data/logs

# NOTE: dbt seed/run/test/docs generate used to run here at image *build*
# time. That broke once the sqlite-sourced models started reading from a
# Postgres landing zone fed by Airbyte (dagview_raw on
# airbyte-db-svc.airbyte.svc.cluster.local) -- that hostname only resolves
# inside the Kubernetes cluster network, which `docker build` doesn't have.
# So the initial dbt build now happens at *container startup* instead (see
# docker-entrypoint.sh), once the pod is actually running on the cluster
# network and can reach the Airbyte Postgres service.
ENV DBT_PROFILES_DIR=/app/dbt_project
COPY backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
