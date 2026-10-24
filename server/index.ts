import { existsSync } from "node:fs";
import path from "node:path";
import express from "express";
import { createApp } from "./app";

const PORT = Number(process.env.PORT ?? 3001);

const app = createApp();

// In "production" mode the same process serves the built SPA, so the whole app
// is one origin. In dev, Vite serves the SPA and proxies /api here.
const distDir = path.resolve(import.meta.dirname, "../dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  // Express 5 requires named wildcards — a bare '*' throws at startup.
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
