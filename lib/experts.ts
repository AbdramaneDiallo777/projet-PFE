/**
 * Experts agricoles (données de démo — peuvent être branchés sur l’API utilisateurs plus tard).
 */
export type ExpertProfile = {
  id: string;
  name: string;
  title: string;
  specialty: string;
  region: string;
  languages: string;
  /** Gravatar / pravatar seed */
  avatarSeed: string;
};

export const EXPERTS: ExpertProfile[] = [
  {
    id: 'exp-dr-kone',
    name: 'Dr. Amadou Koné',
    title: 'Agronome — sols & fertilisation',
    specialty: 'Analyse de sol, couverture végétale, intrants bio',
    region: 'Afrique de l’Ouest',
    languages: 'FR · EN',
    avatarSeed: 'kone-agro',
  },
  {
    id: 'exp-marie-d',
    name: 'Marie Diallo',
    title: 'Phytopathologiste',
    specialty: 'Maladies fongiques, ravageurs, semences certifiées',
    region: 'Sénégal · CI',
    languages: 'FR',
    avatarSeed: 'diallo-phyto',
  },
  {
    id: 'exp-ibrahim-t',
    name: 'Ibrahim Traoré',
    title: 'Mécanisation & irrigation',
    specialty: 'Tracteurs, pulvérisation, goutte-à-goutte',
    region: 'Mali · Burkina',
    languages: 'FR · BM',
    avatarSeed: 'traore-meca',
  },
  {
    id: 'exp-sarah-l',
    name: 'Sarah Lefèvre',
    title: 'Conseillère export & qualité',
    specialty: 'Normes, traçabilité, contrats acheteurs UE',
    region: 'Union européenne',
    languages: 'FR · EN · ES',
    avatarSeed: 'lefevre-export',
  },
];

export function getExpertById(id: string): ExpertProfile | undefined {
  return EXPERTS.find((e) => e.id === id);
}
