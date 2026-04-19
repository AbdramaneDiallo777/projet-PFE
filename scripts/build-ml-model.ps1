# Génère ml-service/models/agroconnect_model.tflite (réseau léger, poids aléatoires — pour tests).
# Utilise TensorFlow installé dans C:\tff pour éviter les erreurs de chemins longs sous Windows.
# Usage : npm run ml:build-model
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Ml = Join-Path $Root "ml-service"
$Py = Join-Path $Ml "build_stub_model.py"
if (-not (Test-Path $Py)) { Write-Error "Introuvable : $Py" }

$Tff = "C:\tff"
$TfInit = Join-Path $Tff "tensorflow\__init__.py"
if (-not (Test-Path $TfInit)) {
    Write-Host "Installation tensorflow-cpu dans $Tff (première fois, quelques minutes)..."
    py -3 -m pip install tensorflow-cpu -t $Tff --no-cache-dir
}

$env:PYTHONPATH = $Tff
try {
    Set-Location $Ml
    py -3 build_stub_model.py
} finally {
    Remove-Item Env:PYTHONPATH -ErrorAction SilentlyContinue
}
