/** Permet à la barre d’onglets de remonter le ScrollView du tableau de bord sans recharger la route. */
type ScrollHandler = () => void;

let handler: ScrollHandler | null = null;

export function setDashboardHomeScrollHandler(fn: ScrollHandler | null): void {
  handler = fn;
}

export function scrollDashboardHomeToTop(): void {
  handler?.();
}
