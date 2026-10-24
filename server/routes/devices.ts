import { createHash } from "node:crypto";
import { Router } from "express";
import { decodeCursor } from "../../shared/cursor";
import {
  CreateDeviceSchema,
  DeviceCursorQuerySchema,
  DeviceExportQuerySchema,
  DeviceListQuerySchema,
  DeviceSummaryQuerySchema,
  UpdateDeviceSchema,
} from "../../shared/schemas/device";
import { deviceRepository } from "../repository";
import { cursorMatchesQuery } from "../querying";
import { validate } from "../validation";

export const devicesRouter: Router = Router();

const CSV_BATCH = 500;

const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;

const csvLine = (device: {
  id: string;
  name: string;
  model: string;
  status: string;
  description: string;
}) =>
  [device.id, device.name, device.model, device.status, device.description].map(csvCell).join(",");

devicesRouter.get("/", (req, res) => {
  if (req.query.format === "csv") {
    const parsed = validate(DeviceExportQuerySchema, req.query);
    if (!parsed.ok) {
      res.status(400).json(parsed.failure);
      return;
    }

    const rows = deviceRepository.all(parsed.data);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="devices.csv"');
    res.write("id,name,model,status,description\n");
    // Batches keep the write bounded even when the result set is not.
    for (let index = 0; index < rows.length; index += CSV_BATCH) {
      const batch = rows
        .slice(index, index + CSV_BATCH)
        .map(csvLine)
        .join("\n");
      if (batch) res.write(`${batch}\n`);
    }
    res.end();
    return;
  }

  // `limit` on its own means "cursor mode, first page" — no cursor yet.
  const hasCursor = req.query.cursor !== undefined || req.query.limit !== undefined;
  const hasPage = req.query.page !== undefined;

  // Two paging models, never both: mixing them is how rows get skipped.
  if (hasCursor && hasPage) {
    res.status(400).json({
      error: "invalid_query",
      message: "Use either page (offset) or cursor (keyset), not both",
    });
    return;
  }

  if (hasCursor) {
    const parsed = validate(DeviceCursorQuerySchema, req.query);
    if (!parsed.ok) {
      res.status(400).json(parsed.failure);
      return;
    }

    const cursor = parsed.data.cursor === undefined ? null : decodeCursor(parsed.data.cursor);
    if (parsed.data.cursor !== undefined && cursor === null) {
      res.status(400).json({ error: "invalid_cursor", message: "The cursor could not be read" });
      return;
    }

    // A cursor is bound to the query that issued it; silently serving a
    // different result set would be worse than asking the client to restart.
    if (cursor && !cursorMatchesQuery(cursor, parsed.data)) {
      res.status(409).json({
        error: "stale_cursor",
        message:
          "Filters or sort changed since this cursor was issued; start again from the first page",
      });
      return;
    }

    const page = deviceRepository.queryAfter(parsed.data, cursor);
    if (page.nextCursor) {
      const host = Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host;
      const next = new URL(req.originalUrl, `http://${host ?? "localhost"}`);
      next.searchParams.set("cursor", page.nextCursor);
      res.setHeader("Link", `<${next.pathname}${next.search}>; rel="next"`);
    }
    res.setHeader("Cache-Control", "no-store");
    res.json(page);
    return;
  }

  const parsed = validate(DeviceListQuerySchema, req.query);
  if (!parsed.ok) {
    res.status(400).json(parsed.failure);
    return;
  }

  res.setHeader("Cache-Control", "no-store");
  res.json(deviceRepository.query(parsed.data));
});

devicesRouter.get("/summary", (req, res) => {
  const parsed = validate(DeviceSummaryQuerySchema, req.query);
  if (!parsed.ok) {
    res.status(400).json(parsed.failure);
    return;
  }

  const summary = deviceRepository.summary(parsed.data);
  const body = JSON.stringify(summary);
  // Aggregates are the expensive read; make them revalidatable.
  const etag = `"${createHash("sha1").update(body).digest("hex").slice(0, 16)}"`;
  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", "private, max-age=5, must-revalidate");

  if (req.headers["if-none-match"] === etag) {
    res.status(304).end();
    return;
  }

  res.type("application/json").send(body);
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
