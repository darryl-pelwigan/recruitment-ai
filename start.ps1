$root = $PSScriptRoot

Write-Host "Starting Recruitment AI..." -ForegroundColor Cyan
Write-Host ""

Write-Host "  Backend  -> http://localhost:8000/api" -ForegroundColor Green
Write-Host "  API Docs -> http://localhost:8000/docs" -ForegroundColor Green
Write-Host "  Frontend -> http://localhost:5173" -ForegroundColor Blue
Write-Host ""

Start-Process pwsh -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root\backend'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload"
)

Start-Process pwsh -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root\frontend'; npm run dev"
)

Write-Host "Both servers are starting in separate windows." -ForegroundColor Cyan
