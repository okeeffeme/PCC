import { z } from "zod";
import { DeviceSchema, type Device } from "../../shared/schemas/device";
import { readSeedFile } from "./readSeedFile";

/**
 * Reads and validates devices.json against our schema on demand, without
 * holding a second permanent copy of the seed array in module scope.
 */
export function loadSeedDevices(): Device[] {
  const raw: unknown = readSeedFile("devices.json");
  return z.array(DeviceSchema).parse(raw);
}
