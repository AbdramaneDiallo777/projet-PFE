# Service ML Flask (Scan IA) — port 5000 — dossier ml-service/
# TensorFlow est chargé depuis C:\tff si présent (évite les erreurs de chemins longs sous Windows).
# Usage : npm run ml
$ErrorActionPreference = "Stop"
$MlRoot = if ($env:ML_FLASK_PROJECT_DIR -and $env:ML_FLASK_PROJECT_DIR.Trim()) {
    $env:ML_FLASK_PROJECT_DIR.Trim()
} else {
    Join-Path $PSScriptRoot "..\ml-service"
}
if (-not (Test-Path (Join-Path $MlRoot "app.py"))) {
    Write-Error "Dossier ml-service introuvable : $MlRoot"
}

$Tff = "C:\tff"
$TfInit = Join-Path $Tff "tensorflow\__init__.py"
if (-not (Test-Path $TfInit)) {
    Write-Host "Installation tensorflow-cpu dans $Tff (première fois, quelques minutes)..."
    py -3 -m pip install tensorflow-cpu -t $Tff --no-cache-dir
}
$env:PYTHONPATH = $Tff + $(if ($env:PYTHONPATH) { ";" + $env:PYTHONPATH } else { "" })

Set-Location $MlRoot
$venvPy = Join-Path $MlRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPy)) {
    Write-Host "Création du venv dans ml-service..."
    py -3 -m venv .venv
}
# Toujours synchroniser les deps (venv existant sans pip = erreur « No module named flask »)
Write-Host "Dépendances ml-service (Flask, NumPy, Pillow)..."
& .\.venv\Scripts\pip.exe install -r requirements.txt -q
& $venvPy app.py
