"""
Entraînement MobileNetV2 (transfert) — dataset PlantVillage attendu :
  ml-service/PlantVillage/train et PlantVillage/val
Sortie : models/agroconnect_model.h5 puis convertir en TFLite avec convert_to_tflite.py
"""
from pathlib import Path

import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator

BASE = Path(__file__).resolve().parent
MODELS = BASE / "models"
TRAIN_DIR = BASE / "PlantVillage" / "train"
VAL_DIR = BASE / "PlantVillage" / "val"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32

MODELS.mkdir(parents=True, exist_ok=True)


def main() -> None:
    if not TRAIN_DIR.is_dir() or not VAL_DIR.is_dir():
        print(
            "Placez le jeu PlantVillage sous :\n"
            f"  {TRAIN_DIR}\n  {VAL_DIR}\n"
            "Téléchargez le jeu « PlantVillage » (Kaggle) et placez train/ et val/ ici."
        )
        return

    datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=25,
        zoom_range=0.2,
        brightness_range=[0.8, 1.2],
        horizontal_flip=True,
    )

    print("Chargement des images d'entraînement...")
    train_gen = datagen.flow_from_directory(
        str(TRAIN_DIR),
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
    )

    print("Chargement des images de validation...")
    val_gen = datagen.flow_from_directory(
        str(VAL_DIR),
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
    )

    base_model = MobileNetV2(
        weights="imagenet", include_top=False, input_shape=(224, 224, 3)
    )
    base_model.trainable = False

    model = models.Sequential(
        [
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dense(128, activation="relu"),
            layers.Dropout(0.2),
            layers.Dense(train_gen.num_classes, activation="softmax"),
        ]
    )

    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

    print(f"Entraînement — {train_gen.num_classes} classes…")
    model.fit(train_gen, validation_data=val_gen, epochs=3)

    h5_path = MODELS / "agroconnect_model.h5"
    model.save(str(h5_path))
    print(f"Modèle sauvegardé : {h5_path}")


if __name__ == "__main__":
    main()
