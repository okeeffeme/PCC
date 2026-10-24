import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import type { PaginatedDevices } from "../shared/schemas/device";
import { createApp } from "./app";

/**
 * The API is exercised over real HTTP — the same routes the browser calls.
 * The app is created per test file so the in-memory repository starts clean.
 * Read-only tests run before the write tests, because writes are stateful.
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

async function list(path = ""): Promise<PaginatedDevices> {
  const response = await fetch(`${baseUrl}/api/devices${path}`);
  expect(response.status).toBe(200);
  return (await response.json()) as PaginatedDevices;
}

describe("GET /api/devices (offset mode)", () => {
  it("returns a window plus the facts about the whole result", async () => {
    const page = await list();

    expect(page.page).toBe(1);
    expect(page.pageSize).toBe(25);
    expect(page.total).toBe(433);
    expect(page.totalPages).toBe(18);
    expect(page.items).toHaveLength(25);
    expect(page.items[0]).toMatchObject({ id: expect.any(String), name: expect.any(String) });
  });

  it("walks consecutive pages without duplicating or skipping rows", async () => {
    const seen: string[] = [];
    for (let page = 1; page <= 18; page += 1) {
      const result = await list(`?page=${page}&pageSize=25`);
      seen.push(...result.items.map((device) => device.id));
    }

    expect(seen).toHaveLength(433);
    expect(new Set(seen).size).toBe(433);
  });

  it("keeps a total order when the sort key has ties", async () => {
    const seen: string[] = [];
    for (let page = 1; page <= 5; page += 1) {
      const result = await list(`?sort=status&pageSize=100&page=${page}`);
      seen.push(...result.items.map((device) => device.id));
    }

    expect(seen).toHaveLength(433);
    expect(new Set(seen).size).toBe(433);
  });

  it("filters by name and status together", async () => {
    const page = await list("?q=berlin&status=online&pageSize=100");

    expect(page.total).toBe(23);
    expect(page.items).toHaveLength(23);
    for (const device of page.items) {
      expect(device.name.toLowerCase()).toContain("berlin");
      expect(device.status).toBe("online");
    }
  });

  it("returns an empty page beyond the end without losing the totals", async () => {
    const page = await list("?page=999");

    expect(page.items).toHaveLength(0);
    expect(page.total).toBe(433);
    expect(page.totalPages).toBe(18);
  });

  it("rejects an unknown status, sort, page and pageSize", async () => {
    for (const query of ["?status=exploded", "?sort=colour", "?page=0", "?pageSize=1000"]) {
      const response = await fetch(`${baseUrl}/api/devices${query}`);
      expect(response.status, query).toBe(400);
      const body = (await response.json()) as { error: string; issues: { path: string }[] };
      expect(body.error).toBe("validation_failed");
      expect(body.issues.length).toBeGreaterThan(0);
    }
  });
});

describe("GET /api/devices (cursor mode)", () => {
  it("walks the result set with keyset pages and no overlaps", async () => {
    const first = await fetch(`${baseUrl}/api/devices?limit=100`);
    const firstPage = (await first.json()) as { items: { id: string }[]; nextCursor: string };
    expect(firstPage.items).toHaveLength(100);
    expect(firstPage.nextCursor).toEqual(expect.any(String));
    expect(first.headers.get("link")).toContain('rel="next"');

    const second = await fetch(
      `${baseUrl}/api/devices?limit=100&cursor=${encodeURIComponent(firstPage.nextCursor)}`,
    );
    expect(second.status).toBe(200);
    const secondPage = (await second.json()) as { items: { id: string }[]; nextCursor: string };
    expect(secondPage.items).toHaveLength(100);

    const firstIds = new Set(firstPage.items.map((device) => device.id));
    expect(secondPage.items.some((device) => firstIds.has(device.id))).toBe(false);
  });

  it("rejects a cursor issued for a different filter", async () => {
    const first = await fetch(`${baseUrl}/api/devices?limit=10`);
    const { nextCursor } = (await first.json()) as { nextCursor: string };

    const stale = await fetch(
      `${baseUrl}/api/devices?limit=10&status=online&cursor=${encodeURIComponent(nextCursor)}`,
    );

    expect(stale.status).toBe(409);
    const body = (await stale.json()) as { error: string };
    expect(body.error).toBe("stale_cursor");
  });

  it("rejects an unreadable cursor", async () => {
    const response = await fetch(`${baseUrl}/api/devices?cursor=not-a-cursor`);

    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: string }).error).toBe("invalid_cursor");
  });

  it("refuses to mix page and cursor", async () => {
    const response = await fetch(`${baseUrl}/api/devices?page=2&cursor=abc`);

    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: string }).error).toBe("invalid_query");
  });
});

describe("GET /api/devices/summary", () => {
  it("counts the fleet by status", async () => {
    const response = await fetch(`${baseUrl}/api/devices/summary`);
    const summary = (await response.json()) as Record<string, number>;

    expect(summary).toEqual({
      total: 433,
      online: 180,
      inMeeting: 120,
      offline: 85,
      deactivated: 48,
    });
  });

  it("returns facets for the name filter and ignores the status filter", async () => {
    const unfiltered = (await (
      await fetch(`${baseUrl}/api/devices/summary?q=berlin`)
    ).json()) as Record<string, number>;
    const withStatus = (await (
      await fetch(`${baseUrl}/api/devices/summary?q=berlin&status=online`)
    ).json()) as Record<string, number>;

    expect(unfiltered).toEqual({
      total: 54,
      online: 23,
      inMeeting: 15,
      offline: 10,
      deactivated: 6,
    });
    expect(withStatus).toEqual(unfiltered);
  });

  it("revalidates with an ETag", async () => {
    const first = await fetch(`${baseUrl}/api/devices/summary`);
    const etag = first.headers.get("etag");
    expect(etag).toEqual(expect.any(String));

    const second = await fetch(`${baseUrl}/api/devices/summary`, {
      headers: { "If-None-Match": etag! },
    });
    expect(second.status).toBe(304);
  });
});

describe("GET /api/devices?format=csv", () => {
  it("streams every matching row as an attachment", async () => {
    const response = await fetch(`${baseUrl}/api/devices?format=csv&q=berlin`);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("attachment");

    const lines = (await response.text()).trim().split("\n");
    expect(lines[0]).toBe("id,name,model,status,description");
    expect(lines).toHaveLength(55);
    expect(lines.slice(1).every((line) => line.includes("Berlin"))).toBe(true);
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

    const after = await list("?q=Test Room");
    expect(after.total).toBe(1);
    expect(after.items[0]?.id).toBe(created.id);
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
    const page = await list("?q=Berlin");
    const device = page.items[0]!;

    const response = await fetch(`${baseUrl}/api/devices/${device.id}`, {
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
    const page = await list("?q=Berlin");
    const device = page.items[0]!;

    const response = await fetch(`${baseUrl}/api/devices/${device.id}`, { method: "DELETE" });
    expect(response.status).toBe(204);

    const after = await fetch(`${baseUrl}/api/devices/${device.id}`);
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
