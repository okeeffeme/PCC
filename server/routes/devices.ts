import { Router } from "express";
import {
  CreateDeviceSchema,
  DeviceListQuerySchema,
  UpdateDeviceSchema,
} from "../../shared/schemas/device";
import { deviceRepository } from "../repository";
import { validate } from "../validation";

export const devicesRouter: Router = Router();

const summarise = (devices: { status: string }[]) => ({
  total: devices.length,
  online: devices.filter((device) => device.status === "online").length,
  inMeeting: devices.filter((device) => device.status === "inMeeting").length,
  offline: devices.filter((device) => device.status === "offline").length,
  deactivated: devices.filter((device) => device.status === "deactivated").length,
});

devicesRouter.get("/", (req, res) => {
  const parsed = validate(DeviceListQuerySchema, req.query);
  if (!parsed.ok) {
    res.status(400).json(parsed.failure);
    return;
  }

  const { q, status, model, sort, order } = parsed.data;
  let devices = deviceRepository.list();

  if (q) {
    const needle = q.toLowerCase();
    devices = devices.filter((device) => device.name.toLowerCase().includes(needle));
  }
  if (status) devices = devices.filter((device) => device.status === status);
  if (model) devices = devices.filter((device) => device.model === model);

  const direction = order === "asc" ? 1 : -1;
  devices = [...devices].sort((a, b) => a[sort].localeCompare(b[sort]) * direction);

  res.json(devices);
});

devicesRouter.get("/summary", (_req, res) => {
  res.json(summarise(deviceRepository.list()));
});

devicesRouter.post("/", (req, res) => {
  const parsed = validate(CreateDeviceSchema, req.body);
  if (!parsed.ok) {
    res.status(400).json(parsed.failure);
    return;
  }

  if (deviceRepository.findByName(parsed.data.name)) {
    res
      .status(409)
      .json({ error: "duplicate_name", message: "A device with that name already exists" });
    return;
  }

  res.status(201).json(deviceRepository.create(parsed.data));
});

devicesRouter.patch("/:id", (req, res) => {
  const parsed = validate(UpdateDeviceSchema, req.body);
  if (!parsed.ok) {
    res.status(400).json(parsed.failure);
    return;
  }

  const existing = deviceRepository.findById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: "not_found", message: "No device with that id" });
    return;
  }

  if (parsed.data.name !== undefined && deviceRepository.findByName(parsed.data.name)) {
    res
      .status(409)
      .json({ error: "duplicate_name", message: "A device with that name already exists" });
    return;
  }

  const updated = deviceRepository.update(req.params.id, parsed.data);
  if (!updated) {
    res.status(404).json({ error: "not_found", message: "No device with that id" });
    return;
  }

  res.json(updated);
});

devicesRouter.delete("/:id", (req, res) => {
  const removed = deviceRepository.remove(req.params.id);
  if (!removed) {
    res.status(404).json({ error: "not_found", message: "No device with that id" });
    return;
  }
  res.status(204).end();
});
