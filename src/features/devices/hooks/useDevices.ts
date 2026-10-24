import { useSuspenseQuery } from "@tanstack/react-query";
import { fetchDeviceHistory, fetchDevices } from "../api/deviceApi";
import { deviceKeys } from "../api/queryKeys";
import { summarizeDevices } from "./summarizeDevices";

const LIST_OPTIONS = {
  staleTime: 30_000,
  gcTime: 10 * 60_000,
  refetchOnWindowFocus: false,
  retry: 1,
} as const;

/**
 * The device list. The summary is a `select` over the same cached array, so
 * the counts on the cards can never disagree with the rows in the table.
 */
export function useDevicesQuery() {
  return useSuspenseQuery({
    queryKey: deviceKeys.list(),
    queryFn: ({ signal }) => fetchDevices(signal),
    ...LIST_OPTIONS,
  });
}

export function useDeviceSummaryQuery() {
  return useSuspenseQuery({
    queryKey: deviceKeys.list(),
    queryFn: ({ signal }) => fetchDevices(signal),
    select: summarizeDevices,
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
