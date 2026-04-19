"""Filtre un dossier de classes PlantVillage (conserve cultures listées)."""
import os
import shutil

dataset_path = "clean_data"
cultures_africaines = [
    "Corn",
    "Tomato",
    "Cassava",
    "Potato",
    "Pepper_bell",
    "Squash",
]


def clean_dataset(path: str) -> None:
    if not os.path.exists(path):
        print(f"Erreur : le dossier {path} n'existe pas.")
        return

    print("--- Nettoyage du dataset ---")
    for folder in os.listdir(path):
        is_useful = any(culture in folder for culture in cultures_africaines)
        if not is_useful:
            folder_path = os.path.join(path, folder)
            print(f"Suppression : {folder}")
            shutil.rmtree(folder_path)

    print("--- Terminé ---")
    print(f"Dossiers restants : {os.listdir(path)}")


if __name__ == "__main__":
    clean_dataset(dataset_path)
