import json
from typing import Tuple

import httpx

from backend.config import OLLAMA_URL, OLLAMA_MODEL
from backend.models import WeatherResponse, RecommendationResponse, RiskLevel


def _rule_based_recommendations(weather: WeatherResponse) -> RecommendationResponse:
  analysis = []
  recommendations = []
  risk_level: RiskLevel = "Low"

  # Temperature rule
  if weather.temperature > 32:
    analysis.append("Température élevée détectée (> 32°C).")
    recommendations.append(
      "Risque de stress thermique pour les cultures, renforcer l'irrigation et éviter les travaux aux heures les plus chaudes."
    )
    risk_level = "Medium"

  # Humidity rule
  if weather.humidity > 80:
    analysis.append("Humidité élevée détectée (> 80%).")
    recommendations.append(
      "Risque accru de maladies fongiques, surveiller les cultures et planifier des traitements préventifs si nécessaire."
    )
    risk_level = "Medium" if risk_level == "Low" else "High"

  # Rain rule
  if weather.rain.lastHour is None or weather.rain.lastHour == 0:
    analysis.append("Aucune pluie récente détectée.")
    recommendations.append(
      "Surveiller l'humidité du sol et ajuster l'irrigation pour éviter le stress hydrique."
    )
    if risk_level == "Low":
      risk_level = "Medium"

  # Wind rule
  if weather.wind.speed > 9:
    analysis.append("Vent fort détecté (> 9 m/s).")
    recommendations.append(
      "Éviter les traitements phytosanitaires (pesticides) pendant ces conditions pour limiter la dérive."
    )
    risk_level = "High"

  if not analysis:
    analysis.append("Conditions météorologiques globalement favorables.")
  if not recommendations:
    recommendations.append(
      "Poursuivre les pratiques culturales habituelles en surveillant régulièrement les conditions locales."
    )

  return RecommendationResponse(
    analysis=analysis,
    recommendations=recommendations,
    risk_level=risk_level,
  )


def _build_ollama_prompt(weather: WeatherResponse) -> str:
  return (
    "Tu es un expert agronome spécialisé dans l'agriculture en Afrique.\n"
    "Analyse les conditions météo suivantes et propose des recommandations agricoles adaptées.\n\n"
    f"Température: {weather.temperature} °C\n"
    f"Humidité: {weather.humidity} %\n"
    f"Vent: {weather.wind.speed} m/s\n"
    f"Pluie (dernière heure): {weather.rain.lastHour or 0} mm\n\n"
    "Règles de base à respecter dans ton analyse :\n"
    "- Température > 32°C -> risque de stress thermique, irrigation recommandée.\n"
    "- Humidité > 80% -> risque de maladies fongiques.\n"
    "- Pas de pluie récente -> surveiller l'irrigation.\n"
    "- Vent > 9 m/s -> éviter les traitements pesticides.\n\n"
    "Contraintes de qualite :\n"
    "- Fournis 3 a 5 points d'analyse concrets et utiles.\n"
    "- Fournis 4 a 7 recommandations actionnables (verbes d'action, simples).\n"
    "- Adapte le langage a un agriculteur terrain.\n"
    "- N'invente pas de donnees non presentes.\n\n"
    "La sortie doit etre en francais simple.\n"
    "Répond STRICTEMENT au format JSON suivant (sans texte avant ou après) :\n"
    '{\n'
    '  \"analysis\": [\"point d\\u2019analyse 1\", \"point d\\u2019analyse 2\"],\n'
    '  \"recommendations\": [\"recommandation 1\", \"recommandation 2\"],\n'
    '  \"risk_level\": \"Low\" | \"Medium\" | \"High\"\n'
    "}"
  )


async def _call_ollama_for_recommendations(
  weather: WeatherResponse,
) -> Tuple[bool, RecommendationResponse]:
  """
  Call Ollama Llama3 model. Returns (success, RecommendationResponse).
  If parsing fails, success=False and the caller should fallback to rule-based logic.
  """
  prompt = _build_ollama_prompt(weather)

  payload = {
    "model": OLLAMA_MODEL,
    "prompt": prompt,
    "stream": False,
  }

  try:
    async with httpx.AsyncClient(timeout=30.0) as client:
      resp = await client.post(OLLAMA_URL, json=payload)
      resp.raise_for_status()
      data = resp.json()
  except Exception:
    return False, _rule_based_recommendations(weather)

  raw_response = data.get("response")
  if not isinstance(raw_response, str):
    return False, _rule_based_recommendations(weather)

  try:
    parsed = json.loads(raw_response)
  except json.JSONDecodeError:
    return False, _rule_based_recommendations(weather)

  try:
    analysis = [str(x).strip() for x in parsed.get("analysis", []) if str(x).strip()]
    recommendations = [str(x).strip() for x in parsed.get("recommendations", []) if str(x).strip()]
    risk_level = parsed.get("risk_level", "Low")
    if risk_level not in ("Low", "Medium", "High"):
      risk_level = "Low"

    # Quality gate: ensure minimum useful content, otherwise fallback to deterministic rules.
    if len(analysis) < 2 or len(recommendations) < 3:
      return False, _rule_based_recommendations(weather)

    # Keep deterministic safety: never return AI risk below hard-rule risk.
    rule_risk = _rule_based_recommendations(weather).risk_level
    severity = {"Low": 1, "Medium": 2, "High": 3}
    if severity[rule_risk] > severity[risk_level]:
      risk_level = rule_risk

    ai_based = RecommendationResponse(
      analysis=analysis,
      recommendations=recommendations,
      risk_level=risk_level,  # type: ignore[arg-type]
    )
    return True, ai_based
  except Exception:
    return False, _rule_based_recommendations(weather)


async def generate_recommendations(weather: WeatherResponse) -> RecommendationResponse:
  """
  Try to use AI (Ollama) to generate recommendations.
  If anything goes wrong, fall back to deterministic rule-based recommendations.
  """
  success, ai_reco = await _call_ollama_for_recommendations(weather)
  if success:
    return ai_reco
  return ai_reco

