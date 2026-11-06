export type LobbyRecommendationKind = 'theme' | 'lens';

export interface LobbyRecommendation {
  id: string;
  label: string;
  kind: LobbyRecommendationKind;
  /** Existing seed node used as the one-hop lens for contrast entries. */
  anchorNodeId: string;
}

/** Curated lobby entries, in display order. Never derive this list from graph degree. */
export const LOBBY_RECOMMENDED = [
  {
    id: 'plant-based',
    label: '植物性饮食',
    kind: 'theme',
    anchorNodeId: 'plant_based_diet',
  },
  {
    id: 'animal-foods',
    label: '动物性食物',
    kind: 'lens',
    anchorNodeId: 'animal_foods',
  },
  {
    id: 'added-sugar',
    label: '添加糖',
    kind: 'lens',
    anchorNodeId: 'added_sugar',
  },
] as const satisfies readonly LobbyRecommendation[];
