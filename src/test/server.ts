import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { DEVICE_MODELS, type Device } from "../../shared/schemas/device";
import { filterDevices, sortDevices, offsetWindow, facetSummary } from "../../server/querying";
import type { HistoryPoint } from "../../shared/schemas/history";

/**
 * The tests run against the same HTTP contract the Express server implements.
 * MSW intercepts at the network layer, so the components exercise the real
 * fetch → zod → cache path instead of a mocked module.
 */

const seedDevices: Device[] = [
  {
    id: "dev-1",
    name: "Berlin - Exec Suite 1",
    model: "Neat Bar Pro",
    description: "Video bar for the executive suite.",
    status: "online",
  },
  {
    id: "dev-2",
    name: "Berlin - Boardroom A",
    model: "Logitech Rally Bar",
    description: "Main boardroom bar.",
    status: "inMeeting",
  },
  {
    id: "dev-3",
    name: "Lisbon - Focus Room 2",
    model: "Poly Studio X50",
    description: "Huddle room camera.",
    status: "offline",
  },
  {
    id: "dev-4",
    name: "Oslo - Meeting Room 5",
    model: "Cisco Webex Room Kit",
    description: "Retired unit in storage.",
    status: "deactivated",
  },
];

/** The mutable list the handlers operate on. Reset between tests. */
export const devices: Device[] = [...seedDevices];

export function resetDevices() {
  devices.length = 0;
  devices.push(...seedDevices.map((device) => ({ ...device })));
}

export const history: HistoryPoint[] = [
  { period: "2025-06", online: 120, inMeeting: 40, offline: 30, deactivated: 20 },
  { period: "2025-07", online: 140, inMeeting: 45, offline: 28, deactivated: 19 },
  { period: "2025-08", online: 180, inMeeting: 120, offline: 85, deactivated: 48 },
];

export const handlers = [
  http.get("/api/devices", ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? undefined;
    const status = (url.searchParams.get("status") as Device["status"] | null) ?? undefined;
    const model = url.searchParams.get("model") ?? undefined;
    const sort = (url.searchParams.get("sort") as "name" | "model" | "status") ?? "name";
    const order = (url.searchParams.get("order") as "asc" | "desc") ?? "asc";
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "25");

    if (url.searchParams.get("format") === "csv") {
      const rows = sortDevices(filterDevices(devices, { q, status, model }), sort, order);
      const csv = [
        "id,name,model,status,description",
        ...rows.map(
          (d) =>
            `"${d.id}","${d.name.replaceAll('"', '""')}","${d.model.replaceAll('"', '""')}","${d.status}","${d.description.replaceAll('"', '""')}"`,
        ),
      ].join("\n");
      return new HttpResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="devices.csv"',
        },
      });
    }

    const filtered = filterDevices(devices, { q, status, model });
    const sorted = sortDevices(filtered, sort, order);
    const window = offsetWindow(sorted, page, pageSize);
    return HttpResponse.json({
      items: window.items,
      page,
      pageSize,
      total: window.total,
      totalPages: window.totalPages,
    });
  }),
  http.get("/api/devices/summary", ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? undefined;
    const model = url.searchParams.get("model") ?? undefined;
    return HttpResponse.json(facetSummary(devices, { q, model }));
  }),
  http.get("/api/devices/history", () => HttpResponse.json(history)),
  http.post("/api/devices", async ({ request }) => {
    const body = (await request.json()) as Partial<Device>;
    if (!body.name || !DEVICE_MODELS.includes(body.model as never)) {
      return HttpResponse.json(
        { error: "invalid_input", message: "Invalid device payload", issues: [] },
        { status: 400 },
      );
    }
    if (devices.some((device) => device.name === body.name)) {
      return HttpResponse.json(
        { error: "duplicate_name", message: "A device with that name already exists", issues: [] },
        { status: 409 },
      );
    }
    const created: Device = {
      id: `dev-${devices.length + 1}`,
      name: body.name as string,
      model: body.model as Device["model"],
      description: body.description ?? "",
      status: body.status ?? "online",
    };
    devices.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch("/api/devices/:id", async ({ params, request }) => {
    const device = devices.find((candidate) => candidate.id === params.id);
    if (!device) {
      return HttpResponse.json(
        { error: "not_found", message: "Device not found", issues: [] },
        { status: 404 },
      );
    }
    const body = (await request.json()) as Partial<Device>;
    const updated = { ...device, ...body };
    devices.splice(devices.indexOf(device), 1, updated);
    return HttpResponse.json(updated);
  }),
  http.delete("/api/devices/:id", ({ params }) => {
    const index = devices.findIndex((candidate) => candidate.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { error: "not_found", message: "Device not found", issues: [] },
        { status: 404 },
      );
    }
    devices.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export const server = setupServer(...handlers);
