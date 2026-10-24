import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateDeviceInput,
  PaginatedDevices,
  UpdateDeviceInput,
} from "../../../../shared/schemas/device";
import { createDevice, deleteDevice, updateDevice } from "../api/deviceApi";
import { deviceKeys } from "../api/queryKeys";

/**
 * Writes are optimistic only where the server-owned window is unaffected:
 * edit and delete patch or remove rows that appear in cached pages (position
 * unchanged); a brand-new device has an unknowable sort position, so create
 * waits for the server and invalidates every list window + the facets.
 */
export function useDeviceMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (input: CreateDeviceInput) => createDevice(input),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: deviceKeys.summaries() });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDeviceInput }) =>
      updateDevice(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: deviceKeys.lists() });
      const previous = queryClient.getQueriesData<PaginatedDevices>({
        queryKey: deviceKeys.lists(),
      });
      queryClient.setQueriesData<PaginatedDevices>({ queryKey: deviceKeys.lists() }, (current) =>
        current
          ? {
              ...current,
              items: current.items.map((device) =>
                device.id === id ? { ...device, ...input } : device,
              ),
            }
          : current,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (!context?.previous) return;
      for (const [key, value] of context.previous) {
        queryClient.setQueryData(key, value);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: deviceKeys.summaries() });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDevice(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: deviceKeys.lists() });
      const previous = queryClient.getQueriesData<PaginatedDevices>({
        queryKey: deviceKeys.lists(),
      });
      queryClient.setQueriesData<PaginatedDevices>({ queryKey: deviceKeys.lists() }, (current) =>
        current
          ? {
              ...current,
              items: current.items.filter((device) => device.id !== id),
              total: Math.max(0, current.total - 1),
            }
          : current,
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (!context?.previous) return;
      for (const [key, value] of context.previous) {
        queryClient.setQueryData(key, value);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: deviceKeys.summaries() });
    },
  });

  return { create, update, remove };
}

export type DeviceMutations = ReturnType<typeof useDeviceMutations>;
