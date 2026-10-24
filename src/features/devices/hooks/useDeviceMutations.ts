import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateDeviceInput,
  Device,
  UpdateDeviceInput,
} from "../../../../shared/schemas/device";
import { createDevice, deleteDevice, updateDevice } from "../api/deviceApi";
import { deviceKeys } from "../api/queryKeys";

/**
 * Writes are optimistic: the cache is updated immediately, rolled back if the
 * request fails, and reconciled with the server afterwards.
 */
export function useDeviceMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (input: CreateDeviceInput) => createDevice(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: deviceKeys.list() });
      const previous = queryClient.getQueryData<Device[]>(deviceKeys.list());
      const optimistic: Device = {
        id: `optimistic-${Date.now()}`,
        name: input.name,
        model: input.model,
        description: input.description,
        status: input.status,
      };
      queryClient.setQueryData<Device[]>(deviceKeys.list(), (current) =>
        current ? [...current, optimistic] : current,
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(deviceKeys.list(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: deviceKeys.list() });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDeviceInput }) =>
      updateDevice(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: deviceKeys.list() });
      const previous = queryClient.getQueryData<Device[]>(deviceKeys.list());
      queryClient.setQueryData<Device[]>(deviceKeys.list(), (current) =>
        current?.map((device) => (device.id === id ? { ...device, ...input } : device)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(deviceKeys.list(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: deviceKeys.list() });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDevice(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: deviceKeys.list() });
      const previous = queryClient.getQueryData<Device[]>(deviceKeys.list());
      queryClient.setQueryData<Device[]>(deviceKeys.list(), (current) =>
        current?.filter((device) => device.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(deviceKeys.list(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: deviceKeys.list() });
    },
  });

  return { create, update, remove };
}

export type DeviceMutations = ReturnType<typeof useDeviceMutations>;
