import json
import logging

import httpx

from backend.config import (
  OLLAMA_FALLBACK,
  OLLAMA_HTTP_TIMEOUT,
  OLLAMA_MODEL,
  OLLAMA_URL,
  OPENAI_API_KEY,
  OPENAI_CHAT_MODEL,
)
from backend.models import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)


def _build_chat_prompt(message: str) -> str:
  """
  Build a French-first system prompt for the agricultural assistant.
  The model must classify the intent and answer in the user's language (FR or EN).
  """
  return (
    "Tu es « AgroConnect Assistant », un assistant agricole spécialisé pour les agriculteurs africains.\n"
    "Tu aides sur : maladies des cultures, irrigation, interprétation de la météo, choix des dates de semis, "
    "et informations sur les marchés.\n\n"
    "Analyse la question de l'agriculteur et classe-la dans UNE seule catégorie d'intention :\n"
    "- \"weather_analysis\" : questions sur la météo, risque de pluie, interprétation des prévisions.\n"
    "- \"disease_detection\" : symptômes sur les feuilles, taches, jaunissement, ravageurs, maladies.\n"
    "- \"map\" : besoin de localisation, cartes, zones géographiques, proximité de services agricoles.\n"
    "- \"marketplace\" : prix, vente, achat d'intrants, marché, rendement économique.\n"
    "- \"help\" : aide générale, fonctionnement de la plateforme, questions diverses.\n\n"
    "Règles IMPORTANTES :\n"
    "- Réponds dans la même langue que la question (français ou anglais en priorité).\n"
    "- Donne une réponse pratique, concrète et adaptée à l'agriculture en Afrique.\n"
    "- Si tu n'es pas sûr, choisis l'intention \"help\".\n\n"
    "Répond STRICTEMENT au format JSON suivant (sans aucun texte avant ou après) :\n"
    "{\n"
    '  \"reply\": \"ta réponse détaillée pour l\'agriculteur\",\n'
    '  \"intent\": \"weather_analysis\" | \"disease_detection\" | \"map\" | \"marketplace\" | \"help\"\n'
    "}\n\n"
    f"Question de l'agriculteur : {message}\n"
  )


async def _call_openai_chat(payload: ChatRequest) -> ChatResponse | None:
  if not OPENAI_API_KEY:
    return None
  prompt = _build_chat_prompt(payload.message)
  try:
    async with httpx.AsyncClient(timeout=45.0) as client:
      resp = await client.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
          "Authorization": f"Bearer {OPENAI_API_KEY}",
          "Content-Type": "application/json",
        },
        json={
          "model": OPENAI_CHAT_MODEL,
          "messages": [{"role": "user", "content": prompt}],
          "temperature": 0.4,
        },
      )
      resp.raise_for_status()
      data = resp.json()
      raw = data["choices"][0]["message"]["content"]
  except Exception as exc:
    logger.warning(
      "OpenAI indisponible ou erreur API (model=%s) — bascule Ollama si possible: %s",
      OPENAI_CHAT_MODEL,
      exc,
      exc_info=True,
    )
    return None
  if not isinstance(raw, str):
    return None
  try:
    parsed = json.loads(raw.strip())
  except json.JSONDecodeError:
    return ChatResponse(reply=raw[:2000], intent="help")
  reply = str(parsed.get("reply") or "").strip()
  intent = str(parsed.get("intent") or "help")
  if intent not in ("weather_analysis", "disease_detection", "map", "marketplace", "help"):
    intent = "help"
  if not reply:
    return None
  return ChatResponse(reply=reply, intent=intent)  # type: ignore[arg-type]


async def call_ollama_for_chat(payload: ChatRequest) -> ChatResponse:
  """
  Chat agricole : OpenAI si OPENAI_API_KEY, sinon Ollama local (si OLLAMA_FALLBACK).
  """
  oa = await _call_openai_chat(payload)
  if oa is not None:
    return oa

  if not OLLAMA_FALLBACK:
    hint = (
      "Vérifiez OPENAI_API_KEY, le solde / quotas OpenAI et les logs du serveur (erreur détaillée ci-dessus). "
      "Pour réactiver Ollama en secours : OLLAMA_FALLBACK=true dans .env."
    )
    if not OPENAI_API_KEY:
      hint = (
        "Aucune clé OpenAI configurée alors que OLLAMA_FALLBACK=false. "
        "Définissez OPENAI_API_KEY dans .env ou mettez OLLAMA_FALLBACK=true pour utiliser Ollama."
      )
    return ChatResponse(
      reply=(
        "Le chat Agrobot n’a pas pu obtenir de réponse (OpenAI uniquement, sans secours Ollama). "
        + hint
      ),
      intent="help",
    )

  prompt = _build_chat_prompt(payload.message)

  ollama_payload = {
    "model": OLLAMA_MODEL,
    "prompt": prompt,
    "stream": False,
  }

  try:
    # ReadTimeout si llama3 sur CPU / premier run : augmenter OLLAMA_HTTP_TIMEOUT dans .env.
    ollama_timeout = httpx.Timeout(
      connect=30.0,
      read=OLLAMA_HTTP_TIMEOUT,
      write=30.0,
      pool=30.0,
    )
    async with httpx.AsyncClient(timeout=ollama_timeout) as client:
      resp = await client.post(OLLAMA_URL, json=ollama_payload)
      resp.raise_for_status()
      data = resp.json()
  except Exception as exc:
    logger.warning(
      "Ollama indisponible pour /api/chat (url=%s, model=%s): %s",
      OLLAMA_URL,
      OLLAMA_MODEL,
      exc,
      exc_info=True,
    )
    return ChatResponse(
      reply=(
        "Je ne parviens pas à contacter le modèle d'intelligence artificielle pour le moment. "
        "Réessaie dans quelques instants ou vérifie ta connexion."
      ),
      intent="help",
    )

  raw_response = data.get("response")
  if not isinstance(raw_response, str):
    return ChatResponse(
      reply=(
        "Je rencontre des difficultés pour analyser ta question. "
        "Peux-tu la reformuler avec un peu plus de détails sur ta culture, la météo et le problème observé ?"
      ),
      intent="help",
    )

  try:
    parsed = json.loads(raw_response)
  except json.JSONDecodeError:
    return ChatResponse(
      reply=(
        "Je n'ai pas bien compris la réponse du modèle. "
        "Peux-tu préciser ta question (type de culture, stade, symptômes, météo récente) ?"
      ),
      intent="help",
    )

  reply = str(parsed.get("reply") or "").strip()
  intent = str(parsed.get("intent") or "help")

  if intent not in ("weather_analysis", "disease_detection", "map", "marketplace", "help"):
    intent = "help"

  if not reply:
    reply = (
      "Je n'ai pas assez d'informations pour te donner un conseil précis. "
      "Indique le type de culture, son âge, les symptômes observés et la météo récente."
    )

  return ChatResponse(reply=reply, intent=intent)  # type: ignore[arg-type]

