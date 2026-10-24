import { z } from "zod";
import { DeviceSchema } from "../../shared/schemas/device";
import { readSeedFile } from "./readSeedFile";

/**
 * The provided devices.json, parsed and validated against our own schema at
 * startup. If the brief's data ever stops matching the contract, the server
 * fails loudly instead of serving something subtly wrong.
 */
const raw: unknown = readSeedFile("devices.json");

export const seededDevices = z.array(DeviceSchema).parse(raw);
