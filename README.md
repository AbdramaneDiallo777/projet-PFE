# AgroConnect Africa

<div align="center">

**Plateforme mobile et API pour l’agriculture de précision en Afrique**  
*Projet de fin d’études (PFE) — application Expo (React Native), backend FastAPI, intelligence embarquée et assistant conversationnel.*

[![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Expo](https://img.shields.io/badge/App-Expo%20SDK-000020?style=flat&logo=expo)](https://expo.dev/)
[![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/Licence-MIT-blue.svg)](LICENSE)

</div>

---

## Table des matières

- [Vision](#vision)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation rapide](#installation-rapide)
- [Variables d’environnement](#variables-denvironnement)
- [Lancement en développement](#lancement-en-développement)
- [Services auxiliaires](#services-auxiliaires)
- [Documentation API](#documentation-api)
- [Machine learning (Scan IA)](#machine-learning-scan-ia)
- [Sécurité et bonnes pratiques](#sécurité-et-bonnes-pratiques)
- [Structure du dépôt](#structure-du-dépôt)
- [Auteurs](#auteurs)

---

## Vision

**AgroConnect Africa** connecte les acteurs agricoles à des outils de **cartographie**, de **gestion de parcelles**, de **marché B2B**, de **logistique** et d’**aide à la décision** (météo, recommandations, **assistant IA**). L’objectif est d’offrir une base technique **modulaire**, **documentée** et **évolutive**, adaptée aux contraintes terrain (connectivité, terminaux mobiles, déploiement API).

---

## Fonctionnalités

| Domaine | Description |
|--------|-------------|
| **Authentification** | Comptes utilisateurs, rôles, sessions sécurisées (JWT côté API). |
| **Parcelles & agronomie** | Suivi des parcelles, données géographiques et indicateurs agronomiques. |
| **Cartographie** | Visualisation et interaction cartographique (tableau de bord). |
| **Marketplace** | Offres produits, réservations, historique d’échanges. |
| **Paiements & logistique** | Flux de commande, suivi de livraison (intégration évolutive). |
| **Dashboard** | Statistiques et synthèses pour l’exploitant. |
| **Scan IA** | Diagnostic assisté sur image de feuille via modèle **TensorFlow Lite** (classes type PlantVillage), servi par un micro-service Flask derrière FastAPI. |
| **Assistant (Agrobot)** | Chat contextualisé : **Ollama** en local et/ou **OpenAI** selon configuration. |

---

## Architecture

```text
┌─────────────────────┐     HTTPS / LAN      ┌──────────────────────────┐
│  App mobile (Expo)  │ ◄──────────────────► │  FastAPI (port 8000)      │
│  React Native       │    REST + uploads   │  PostgreSQL · JWT · ML    │
└─────────────────────┘                     └─────────────┬────────────┘
                                                          │
                        ┌─────────────────────────────────┼─────────────────┐
                        │                                 │                 │
                        ▼                                 ▼                 ▼
                 ┌─────────────┐                 ┌──────────────┐   ┌───────────┐
                 │ Flask ML     │                 │ Ollama /     │   │ Fichiers  │
                 │ TFLite :5000 │                 │ OpenAI chat  │   │ statiques │
                 └─────────────┘                 └──────────────┘   └───────────┘
```

- **Frontend** : Expo Router, TypeScript, composants adaptés grand écran / mobile.
- **Backend** : FastAPI, préfixe `/api`, versionnement des routes ML sous `/api/v1`.
- **Données** : PostgreSQL (Docker recommandé en développement).
- **ML** : inférence **TFLite** dans `ml-service/` ; entraînement optionnel via scripts Python du dossier.

---

## Prérequis

- **Node.js** LTS et **npm**
- **Python 3.10+** (backend + scripts ML)
- **Docker** (pour PostgreSQL : `npm run db:up`)
- **Git**
- *(Optionnel)* **Ollama** pour l’assistant local  
- *(Optionnel)* **Android SDK / Xcode** pour builds natifs hors Expo Go

---

## Dossier local (nom du projet)

Pour refléter le nom **AgroConnect Africa** sur le disque, renommez le dossier racine du dépôt (celui qui contient `package.json`) en **`AgroConnectAfrica`** lorsque l’IDE est fermé, sinon Windows peut refuser le renommage :

```powershell
# Exemple (adapter le chemin parent)
Rename-Item -Path "...\Projet\AgroConnectMaps\AgroConnectMaps" -NewName "AgroConnectAfrica"
```

---

## Installation rapide

```bash
git clone https://github.com/AbdramaneDiallo777/projet-PFE.git
cd projet-PFE

# Dépendances Node (racine du projet applicatif)
npm install

# Variables d’environnement
copy .env.example .env    # Windows — ou: cp .env.example .env
# Éditer .env (URL API, base de données, options tunnel, etc.)

# Base de données
npm run db:up
```

> **Nom du dépôt GitHub** : vous pouvez renommer le dépôt en `agroconnect-africa` dans les paramètres GitHub pour l’aligner sur le produit ; l’URL de clone changera en conséquence.

---

## Variables d’environnement

Le fichier **`.env.example`** décrit les clés attendues. **Ne commitez jamais `.env`** (secrets, tokens ngrok, clés API).

Principales familles de variables :

- **`EXPO_PUBLIC_API_URL`** — URL du backend vue par l’app (IP LAN, tunnel ngrok, etc.).
- **`DATABASE_URL`** — chaîne PostgreSQL (alignée sur `docker-compose.yml` en local).
- **`ML_FLASK_URL`** / configuration backend — cible du service Flask ML (souvent `http://127.0.0.1:5000`).
- **Ollama / OpenAI** — pour l’assistant conversationnel (voir commentaires dans `.env.example`).

---

## Lancement en développement

Dans des terminaux séparés, depuis la racine du projet (là où se trouve `package.json`) :

| Étape | Commande | Rôle |
|-------|----------|------|
| 1 | `npm run api` ou `npm run api:py` | API FastAPI (rechargement automatique) |
| 2 | `npm run ml` | Service Flask + inférence TFLite (Scan IA) |
| 3 | `npm start` | Bundler Expo / Metro (réseau local) |

Sur téléphone physique : même réseau Wi‑Fi que le PC, **`EXPO_PUBLIC_API_URL`** doit pointer vers l’**IPv4** de la machine (pas `127.0.0.1`).

---

## Services auxiliaires

- **`npm run db:down`** — arrêt des conteneurs PostgreSQL.
- **Scripts tunnel** (`tunnel:api`, `tunnel:dev`, etc.) — exposition temporaire pour tests hors LAN (voir `.env.example`).
- **`npm run env:lan`** — aide à afficher l’IP LAN pour configurer l’app.

---

## Documentation API

Une fois l’API démarrée :

- **Swagger UI** : [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc** : [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## Machine learning (Scan IA)

- Code et dépendances : dossier **`ml-service/`** (Flask, `requirements.txt`).
- Modèle : **`models/agroconnect_model.tflite`** + **`models/labels.json`** (générés ou fournis selon votre politique de dépôt).
- Entraînement local : voir **`ml-service/README.md`** et scripts `train_model.py` / `convert_to_tflite.py`.
- En développement, TensorFlow peut être isolé sous Windows (script PowerShell `scripts/start-flask-ml.ps1`).

---

## Sécurité et bonnes pratiques

- Ne versionnez **aucun secret** (fichier `.env`, clés API, jetons ngrok).
- Utilisez **HTTPS** et secrets rotatifs en production.
- Limitez les origines CORS en déploiement réel (variable côté backend).
- Pour un **modèle ML** lourd, envisagez **Git LFS** ou un lien de téléchargement plutôt qu’un fichier énorme dans Git.

---

## Structure du dépôt

```text
.
├── app/                 # Écrans Expo Router (onglets, auth, marché, carte, scan IA…)
├── backend/             # FastAPI — routeurs, modèles, auth, marketplace, ML proxy…
├── ml-service/          # Flask + TFLite — diagnostic feuille
├── scripts/             # Démarrage Expo, tunnels, stack backend/ML
├── lib/                 # Client API, utilitaires front
├── assets/              # Images, polices
├── docker-compose.yml   # PostgreSQL local
├── app.json             # Métadonnées Expo (nom : AgroConnect Africa)
└── package.json         # Scripts npm unifiés
```

---

## Auteurs

**Projet de fin d’études** — équipe et encadrants à compléter selon votre institution.

- Dépôt GitHub : [@AbdramaneDiallo777](https://github.com/AbdramaneDiallo777)

---

## Licence

Ce projet est fourni à des fins académiques et de démonstration. Adaptez la licence (MIT, Apache-2.0, etc.) selon les règles de votre établissement.

---

<p align="center">
  <b>AgroConnect Africa</b> — connecter les données, les sols et les agriculteurs.
</p>
