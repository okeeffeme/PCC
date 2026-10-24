import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { createApp } from "./app";

/**
 * The API is exercised over real HTTP — the same routes the browser calls.
 * The app is created per test file so the in-memory repository starts clean.
 */

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(() => {
  server.close();
});

describe("GET /api/devices", () => {
  it("returns the seeded fleet", async () => {
    const response = await fetch(`${baseUrl}/api/devices`);

    expect(response.status).toBe(200);
    const devices = (await response.json()) as { id: string; name: string }[];
    expect(devices).toHaveLength(433);
    expect(devices[0]).toMatchObject({ id: expect.any(String), name: expect.any(String) });
  });

  it("filters by name and status", async () => {
    const response = await fetch(`${baseUrl}/api/devices?q=berlin&status=online`);
    const devices = (await response.json()) as { name: string; status: string }[];

    expect(devices.length).toBeGreaterThan(0);
    for (const device of devices) {
      expect(device.name.toLowerCase()).toContain("berlin");
      expect(device.status).toBe("online");
    }
  });

  it("rejects an unknown status", async () => {
    const response = await fetch(`${baseUrl}/api/devices?status=exploded`);

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string; issues: { path: string }[] };
    expect(body.error).toBe("validation_failed");
    expect(body.issues[0]?.path).toBe("status");
  });
});

describe("GET /api/devices/summary", () => {
  it("counts the fleet by status", async () => {
    const response = await fetch(`${baseUrl}/api/devices/summary`);
    const summary = (await response.json()) as Record<string, number>;

    expect(summary.total).toBe(433);
    expect(summary.online).toBe(180);
    expect(summary.inMeeting).toBe(120);
    expect(summary.offline).toBe(85);
    expect(summary.deactivated).toBe(48);
  });
});

describe("GET /api/devices/history", () => {
  it("returns the monthly history", async () => {
    const response = await fetch(`${baseUrl}/api/devices/history`);
    const history = (await response.json()) as { period: string }[];

    expect(history).toHaveLength(56);
    expect(history[0]?.period).toBe("2021-01");
  });
});

describe("POST /api/devices", () => {
  it("creates a device", async () => {
    const response = await fetch(`${baseUrl}/api/devices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Room",
        model: "Neat Bar Pro",
        description: "Created by a test.",
        status: "online",
      }),
    });

    expect(response.status).toBe(201);
    const created = (await response.json()) as { id: string; name: string; status: string };
    expect(created.name).toBe("Test Room");
    expect(created.status).toBe("online");
  });

  it("refuses a duplicate name", async () => {
    const payload = {
      name: "Berlin - Exec Suite 1",
      model: "Neat Bar Pro",
      description: "",
      status: "online",
    };
    const response = await fetch(`${baseUrl}/api/devices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(response.status).toBe(409);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("duplicate_name");
  });

  it("rejects an invalid payload", async () => {
    const response = await fetch(`${baseUrl}/api/devices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", model: "Not a model", status: "exploded" }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string; issues: unknown[] };
    expect(body.error).toBe("validation_failed");
    expect(body.issues.length).toBeGreaterThan(0);
  });
});

describe("PATCH /api/devices/:id", () => {
  it("updates a device", async () => {
    const listResponse = await fetch(`${baseUrl}/api/devices?q=Berlin`);
    const [device] = (await listResponse.json()) as { id: string }[];

    const response = await fetch(`${baseUrl}/api/devices/${device!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "deactivated" }),
    });

    expect(response.status).toBe(200);
    const updated = (await response.json()) as { status: string };
    expect(updated.status).toBe("deactivated");
  });

  it("returns 404 for an unknown id", async () => {
    const response = await fetch(`${baseUrl}/api/devices/does-not-exist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "online" }),
    });

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/devices/:id", () => {
  it("removes a device", async () => {
    const listResponse = await fetch(`${baseUrl}/api/devices?q=Berlin`);
    const [device] = (await listResponse.json()) as { id: string }[];

    const response = await fetch(`${baseUrl}/api/devices/${device!.id}`, { method: "DELETE" });
    expect(response.status).toBe(204);

    const after = await fetch(`${baseUrl}/api/devices/${device!.id}`);
    expect(after.status).toBe(404);
  });
});

describe("unknown API routes", () => {
  it("answer with JSON, not the SPA shell", async () => {
    const response = await fetch(`${baseUrl}/api/nope`);

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});
