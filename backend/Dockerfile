FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (e.g. for psycopg2/asyncpg if needed, though asyncpg usually installs fine on slim)
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run DB Migrations and start server
CMD ["sh", "-c", "alembic upgrade head && python -m app.core.db_seeder && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
