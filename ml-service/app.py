"""
Service Flask — diagnostic feuille (PlantVillage / TFLite).
Appelé par FastAPI : GET /health, POST /predict (multipart `file`).
"""
from __future__ import annotations

import io
import json
import os
from pathlib import Path

import numpy as np
from flask import Flask, jsonify, request
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "agroconnect_model.tflite"
LABELS_PATH = BASE_DIR / "models" / "labels.json"

app = Flask(__name__)

interpreter = None
labels: dict[str, str] = {}
input_details = None
output_details = None
_load_error: str | None = None


def _format_label(raw: str) -> str:
    """Libellé lisible à partir du nom de classe PlantVillage."""
    if raw in ("Inconnu", "Unknown"):
        return raw
    parts = raw.split("___")
    if len(parts) >= 2:
        plant = parts[0].replace("_", " ").replace(", bell", " (poivron)")
        state = parts[1].replace("_", " ")
        return f"{plant} — {state}"
    return raw.replace("___", " — ").replace("_", " ")


def _load_tflite() -> bool:
    global interpreter, labels, input_details, output_details, _load_error
    _load_error = None
    if not LABELS_PATH.is_file():
        _load_error = f"Fichier labels introuvable : {LABELS_PATH}"
        return False
    try:
        with open(LABELS_PATH, encoding="utf-8") as f:
            labels = json.load(f)
    except OSError as e:
        _load_error = str(e)
        labels = {}
        return False

    if not MODEL_PATH.is_file():
        _load_error = (
            f"Modèle TFLite absent : {MODEL_PATH}\n"
            "Entraînez avec train_model.py puis convert_to_tflite.py (voir README.md)."
        )
        return False

    try:
        import tensorflow as tf

        interpreter = tf.lite.Interpreter(model_path=str(MODEL_PATH))
        interpreter.allocate_tensors()
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
    except Exception as e:  # noqa: BLE001
        _load_error = f"Chargement TFLite impossible : {e!s}"
        interpreter = None
        return False

    return True


MODEL_LOADED = _load_tflite()


@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok" if MODEL_LOADED else "error",
            "model_loaded": MODEL_LOADED,
            "model_path": str(MODEL_PATH),
            "labels_path": str(LABELS_PATH),
            "num_classes": len(labels),
            "error": None if MODEL_LOADED else (_load_error or "Modèle non chargé"),
        }
    )


@app.route("/predict", methods=["POST"])
def predict():
    if not MODEL_LOADED or interpreter is None or not input_details or not output_details:
        return (
            jsonify(
                {
                    "error": _load_error or "Modèle non chargé",
                    "status": "error",
                    "maladie": "—",
                    "confiance": "0%",
                }
            ),
            503,
        )

    if "file" not in request.files:
        return jsonify({"error": "Aucun fichier envoyé (champ multipart `file`)"}), 400

    file = request.files["file"]
    try:
        img = Image.open(io.BytesIO(file.read())).convert("RGB")
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": f"Image invalide : {e!s}", "status": "error"}), 400

    img = img.resize((224, 224))
    img_array = np.array(img, dtype=np.float32) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    interpreter.set_tensor(input_details[0]["index"], img_array)
    interpreter.invoke()
    output_data = interpreter.get_tensor(output_details[0]["index"])

    prediction_idx = str(int(np.argmax(output_data)))
    raw = labels.get(prediction_idx, "Inconnu")
    confidence = float(np.max(output_data))
    maladie = _format_label(raw)

    return jsonify(
        {
            "maladie": maladie,
            "maladie_code": raw,
            "confiance": f"{confidence * 100:.2f}%",
            "status": "success",
        }
    )


if __name__ == "__main__":
    port = int(os.environ.get("ML_FLASK_PORT", "5000"))
    print(f"ML service AgroConnect — http://127.0.0.1:{port}")
    print(f"  Modèle chargé : {MODEL_LOADED} ({MODEL_PATH})")
    app.run(debug=False, host="0.0.0.0", port=port)
