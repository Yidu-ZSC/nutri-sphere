/** Locked A2 source_id ↔ weread bookId (TASK-NS-060). Single source of truth for sync + validate. */
export const WEREAD_BOOK_MAP = Object.freeze({
  eat_to_heal: '39484588',
  how_not_to_die: '3300017717',
  gut_brain: '24913511',
  amazing_veggie_soup: '3300084701',
  china_study: '3300047535',
  know_your_gut: '26793466',
});

export const WEREAD_SOURCE_IDS = Object.freeze(Object.keys(WEREAD_BOOK_MAP));
