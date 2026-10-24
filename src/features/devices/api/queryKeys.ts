import type { DeviceListParams, DeviceSummaryFilters } from "./deviceApi";

/**
 * One place for every query key. Keys are hierarchical so a single
 * invalidateQueries({ queryKey: deviceKeys.lists() }) can refresh every cached
 * window after a write.
 */
export const deviceKeys = {
  all: ["devices"] as const,
  lists: () => [...deviceKeys.all, "list"] as const,
  list: (params: DeviceListParams) => [...deviceKeys.lists(), params] as const,
  summaries: () => [...deviceKeys.all, "summary"] as const,
  summary: (filters: DeviceSummaryFilters) => [...deviceKeys.summaries(), filters] as const,
  history: () => [...deviceKeys.all, "history"] as const,
};
