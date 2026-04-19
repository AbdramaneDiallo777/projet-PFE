# API AgroConnect (FastAPI) — port 8000 — proxy Scan IA vers Flask (ML_FLASK_URL dans .env ou défaut 127.0.0.1:5000)
# Prérequis : Flask ML déjà lancé sur 5000 (start-flask-ml.ps1) ou utiliser start-backend-stack.ps1
# Usage : .\scripts\start-fastapi.ps1
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
py -3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
