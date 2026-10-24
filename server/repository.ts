import type { CreateDeviceInput, Device, UpdateDeviceInput } from "../shared/schemas/device";
import { seededDevices } from "./seed/devices";

export interface DeviceRepository {
  list(): Device[];
  findById(id: string): Device | undefined;
  findByName(name: string): Device | undefined;
  create(input: CreateDeviceInput): Device;
  update(id: string, input: UpdateDeviceInput): Device | undefined;
  remove(id: string): boolean;
  reset(): void;
}

/**
 * An in-memory store. The interface is the seam: swapping this for Postgres
 * later means reimplementing this file, nothing else.
 */
export function createDeviceRepository(seed: Device[]): DeviceRepository {
  let devices: Device[] = [];
  let nextId = 1;

  const load = () => {
    devices = seed.map((device) => ({ ...device }));
    nextId = devices.length + 1;
  };
  load();

  const nextDeviceId = () => `dev-${String(nextId++).padStart(3, "0")}`;

  return {
    //no sorting or pagination seperate endpoints for aggr vs result sets?
    list: () => devices.map((device) => ({ ...device })),
    findById: (id) => devices.find((device) => device.id === id),
    findByName: (name) =>
      devices.find((device) => device.name.toLowerCase() === name.trim().toLowerCase()),
    create: (input) => {
      const device: Device = {
        id: nextDeviceId(),
        name: input.name.trim(),
        model: input.model.trim(),
        description: input.description.trim(),
        status: input.status,
      };
      devices = [...devices, device];
      return device;
    },
    update: (id, input) => {
      const current = devices.find((device) => device.id === id);
      if (!current) return undefined;
      const updated: Device = {
        ...current,
        ...(input.name === undefined ? {} : { name: input.name.trim() }),
        ...(input.model === undefined ? {} : { model: input.model.trim() }),
        ...(input.description === undefined ? {} : { description: input.description.trim() }),
        ...(input.status === undefined ? {} : { status: input.status }),
      };
      devices = devices.map((device) => (device.id === id ? updated : device));
      return updated;
    },
    remove: (id) => {
      const before = devices.length;
      devices = devices.filter((device) => device.id !== id);
      return devices.length < before;
    },
    reset: load,
  };
}

export const deviceRepository = createDeviceRepository(seededDevices);
