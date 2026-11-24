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

# Seed + build the dbt project + generate docs at image build time so the app
# has data and lineage available immediately on first start.
ENV DBT_PROFILES_DIR=/app/dbt_project
RUN cd /app/dbt_project && dbt seed --project-dir /app/dbt_project --profiles-dir /app/dbt_project \
    && dbt run --project-dir /app/dbt_project --profiles-dir /app/dbt_project \
    && dbt test --project-dir /app/dbt_project --profiles-dir /app/dbt_project || true \
    && dbt docs generate --project-dir /app/dbt_project --profiles-dir /app/dbt_project

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
