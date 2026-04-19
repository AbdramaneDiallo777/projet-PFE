# Référence chatbot (version collègue)

Les fichiers ici proviennent du dossier `CHATBOT` (intention LLM via Ollama uniquement).

## Intégration officielle dans AgroConnect Africa

- **Écran principal** : `app/(onglets)/tableau-de-bord/assistant.tsx` — chat complet (réponse + intention) via **`POST /api/chat`** du backend AgroConnect (`backend/services/chat_service.py`).
- **Tableau de bord** : raccourci **« Agrobot AI »** ouvre cet écran.
- **Backend** : même API que la doc OpenAPI (`/docs`) — pas besoin du mini serveur `collegue-backend-main.py.txt`.

## Fichiers archivés

| Fichier | Rôle |
|---------|------|
| `chatbot-demo-collegue.html` | Démo navigateur (à pointer vers `http://<PC>:8000` si vous exposez uniquement l’intention — l’app native utilise `/api/chat` complet). |
| `collegue-backend-main.py.txt` | Ancienne API FastAPI minimale (référence). |
| `collegue-chatbot_service.py.txt` | Détection d’intention par mot-clé Ollama (`llama3`). |

Pour tester le chat **comme l’app**, utilisez l’écran **Agrobot AI** dans l’application Expo.
