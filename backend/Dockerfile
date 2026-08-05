FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (e.g. for psycopg2/asyncpg if needed, though asyncpg usually installs fine on slim)
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd --system --create-home appuser && chown -R appuser:appuser /app
USER appuser

# Run DB Migrations and start server
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
