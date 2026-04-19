import { router } from 'expo-router';

export type CheckoutSuccessParams = {
  /** Montant affiché (ex. « 241,50 € ») */
  totalLabel: string;
  /** Identifiant commande API (UUID) si disponible */
  orderId?: string;
};

/**
 * Après un paiement validé : retrouver le marché comme base de pile, puis afficher le succès.
 * Évite de repasser par panier / étapes de paiement avec « Retour ».
 */
export function navigateToCheckoutSuccess(params: CheckoutSuccessParams): void {
  router.dismissTo('/marche');
  setTimeout(() => {
    router.push({
      pathname: '/marche/PaymentSuccess',
      params: {
        totalLabel: params.totalLabel,
        orderId: params.orderId ?? '',
      },
    });
  }, 60);
}
