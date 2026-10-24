/**
 * One place for every query key. Keys are hierarchical so a single
 * invalidateQueries({ queryKey: deviceKeys.all }) can refresh the lot.
 */
export const deviceKeys = {
  all: ["devices"] as const,
  list: () => [...deviceKeys.all, "list"] as const,
  summary: () => [...deviceKeys.all, "summary"] as const,
  history: () => [...deviceKeys.all, "history"] as const,
};
