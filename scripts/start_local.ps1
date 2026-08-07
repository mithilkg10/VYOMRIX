Write-Host "Starting Vyomrix Local Native Mode..." -ForegroundColor Cyan

# Check Python environment
if (-not (Test-Path "backend\.venv")) {
    Write-Host "Creating Python virtual environment..."
    python -m venv backend\.venv
}

# Activate and install dependencies
Write-Host "Installing backend dependencies..."
& "backend\.venv\Scripts\python.exe" -m pip install -r backend\requirements.txt -q

# Initialize Local Database
Write-Host "Initializing Local SQLite Database and Sandbox Data..."
$env:VYOMRIX_RUNTIME="local"
$env:VYOMRIX_SANDBOX="true"
$env:PYTHONPATH="."
Set-Location -Path "backend"
& ".\.venv\Scripts\python.exe" -m app.core.local_bootstrap
Set-Location -Path ".."

# Start Backend
Write-Host "Starting FastAPI Backend..."
Start-Process -NoNewWindow -FilePath ".\.venv\Scripts\python.exe" -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" -WorkingDirectory "backend"

# Start Frontend
Write-Host "Starting Next.js Frontend..."
Set-Location -Path "frontend"
npm install
Start-Process -NoNewWindow -FilePath "npm.cmd" -ArgumentList "run dev"

Write-Host "Vyomrix is starting! Press Ctrl+C to stop." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000"
Write-Host "Backend API: http://localhost:8000/api/v1"
