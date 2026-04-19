"""Convertit models/agroconnect_model.h5 → models/agroconnect_model.tflite"""
from pathlib import Path

import tensorflow as tf

BASE = Path(__file__).resolve().parent
H5 = BASE / "models" / "agroconnect_model.h5"
OUT = BASE / "models" / "agroconnect_model.tflite"


def main() -> None:
    if not H5.is_file():
        print(f"Absent : {H5}\nLancez d'abord train_model.py avec un dataset.")
        return

    model = tf.keras.models.load_model(str(H5))
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()
    OUT.write_bytes(tflite_model)
    print(f"TFLite écrit : {OUT} ({OUT.stat().st_size / (1024 * 1024):.2f} Mo)")


if __name__ == "__main__":
    main()
