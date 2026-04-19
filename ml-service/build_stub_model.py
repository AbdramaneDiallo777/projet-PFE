"""
Génère models/agroconnect_model.tflite sans dataset (poids aléatoires).
Utile pour valider la chaîne Scan IA ; remplacez par un modèle entraîné (train_model.py) en production.
"""
from __future__ import annotations

import json
from pathlib import Path

BASE = Path(__file__).resolve().parent
LABELS = BASE / "models" / "labels.json"
OUT = BASE / "models" / "agroconnect_model.tflite"


def main() -> None:
    with open(LABELS, encoding="utf-8") as f:
        labels = json.load(f)
    num_classes = len(labels)
    if num_classes < 1:
        raise SystemExit("labels.json vide")

    import tensorflow as tf

    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(224, 224, 3)),
            tf.keras.layers.Conv2D(16, 5, strides=2, activation="relu", padding="same"),
            tf.keras.layers.MaxPooling2D(2),
            tf.keras.layers.Conv2D(32, 3, activation="relu", padding="same"),
            tf.keras.layers.GlobalAveragePooling2D(),
            tf.keras.layers.Dense(num_classes, activation="softmax"),
        ]
    )
    model.build((None, 224, 224, 3))

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()
    OUT.write_bytes(tflite_model)
    print(f"OK — {OUT} ({OUT.stat().st_size / 1024:.1f} Ko, {num_classes} classes)")
    print("Note : prédictions non fiables tant que vous n'avez pas entraîné avec train_model.py.")


if __name__ == "__main__":
    main()
