"""Estimation de rendement (t/ha) — utilitaire CLI."""


def calculer_rendement_agroconnect(culture: str, surface_ha: float) -> float:
    donnees_cultures = {
        "Maïs": {"densite": 55000, "poids_moyen": 0.3},
        "Tomate": {"densite": 25000, "poids_moyen": 2.5},
        "Manioc": {"densite": 10000, "poids_moyen": 2.0},
    }
    if culture in donnees_cultures:
        c = donnees_cultures[culture]
        total = (surface_ha * c["densite"] * c["poids_moyen"]) / 1000
        return round(total, 2)
    return 0.0


if __name__ == "__main__":
    ma_surface = 1.5
    ma_culture = "Tomate"
    resultat = calculer_rendement_agroconnect(ma_culture, ma_surface)
    print("--- OUTIL D'ESTIMATION AGROCONNECT ---")
    print(f"Culture : {ma_culture}")
    print(f"Surface : {ma_surface} ha")
    print(f"Rendement estimé : {resultat} t/ha\n")
