import { useSuspenseQuery } from "@tanstack/react-query";
import {
  fetchDeviceHistory,
  fetchDevices,
  fetchDeviceSummary,
  type DeviceListParams,
  type DeviceSummaryFilters,
} from "../api/deviceApi";
import { deviceKeys } from "../api/queryKeys";

const LIST_OPTIONS = {
  staleTime: 15_000,
  gcTime: 10 * 60_000,
  refetchOnWindowFocus: false,
  retry: 1,
} as const;

/**
 * The device list for a specific window. Pages are cached per key so moving
 * back to a previously visited page is instant; `placeholderData` is not used
 * because `useSuspenseQuery` disallows it (and we keep the previous window by
 * key identity instead).
 */
export function useDevicesQuery(params: DeviceListParams) {
  return useSuspenseQuery({
    queryKey: deviceKeys.list(params),
    queryFn: ({ signal }) => fetchDevices(params, signal),
    ...LIST_OPTIONS,
  });
}

/**
 * Facet counts for the summary cards. The server ignores the status filter,
 * so the counts stay useful while a card is selected (D-019). We still pass
 * the name filter so the facets match the search.
 */
export function useDeviceSummaryQuery(filters: DeviceSummaryFilters) {
  return useSuspenseQuery({
    queryKey: deviceKeys.summary(filters),
    queryFn: ({ signal }) => fetchDeviceSummary(filters, signal),
    ...LIST_OPTIONS,
  });
}

/** Monthly aggregates are immutable for the session — no refetch needed. */
export function useDeviceHistoryQuery() {
  return useSuspenseQuery({
    queryKey: deviceKeys.history(),
    queryFn: () => fetchDeviceHistory(),
    staleTime: Infinity,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
