import { Redirect } from 'expo-router';

/** Ancienne route unifiée — redirige vers l’espace Services dédié. */
export default function ServiceLegacyRedirect() {
    return <Redirect href="/marche/services" />;
}
