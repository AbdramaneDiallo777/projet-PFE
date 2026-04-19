# Demarre Flask ML (port 5000) puis FastAPI (port 8000) sur le PC de dev.
# Le mobile appelle FastAPI ; FastAPI appelle Flask via ML_FLASK_URL (defaut http://127.0.0.1:5000).
# Usage : .\scripts\start-backend-stack.ps1
$ErrorActionPreference = "Stop"
$ScriptRoot = $PSScriptRoot
$Root = Join-Path $ScriptRoot ".."
$FlaskScript = Join-Path $ScriptRoot "start-flask-ml.ps1"

Write-Host "Ouverture du service Flask ML (fenetre separee)..."
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-File", $FlaskScript
)

Write-Host "Attente de GET http://127.0.0.1:5000/health ..."
$ready = $false
for ($i = 0; $i -lt 45; $i++) {
    try {
        Invoke-WebRequest -Uri "http://127.0.0.1:5000/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop | Out-Null
        $ready = $true
        break
    } catch {
        Start-Sleep -Seconds 1
    }
}
if (-not $ready) {
    Write-Warning "Flask ne repond pas encore sur /health. FastAPI demarre quand meme."
}

Set-Location $Root
Write-Host "FastAPI : http://0.0.0.0:8000 | Swagger : http://127.0.0.1:8000/docs"
py -3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
