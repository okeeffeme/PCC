import express, { type ErrorRequestHandler } from "express";
import { seededHistory } from "./seed/history";
import { devicesRouter } from "./routes/devices";

const LATENCY_MS = Number(process.env.API_LATENCY_MS ?? 0);

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error("[api] unhandled error", error);
  res.status(500).json({ error: "internal_error" });
};

export function createApp() {
  const app = express();

  app.disable("x-powered-by"); //don't need?

  // Be permissive in dev: browsers can hit the API directly (:3001) or through
  // Vite's proxy (:5173). CORS preflight must succeed either way.
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin ?? "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json());

  //could extract to a middleware dir
  if (LATENCY_MS > 0) {
    // Artificial latency so loading states are observable during development.
    app.use((_req, _res, next) => {
      setTimeout(next, LATENCY_MS);
    });
  }

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/devices/history", (_req, res) => {
    res.json(seededHistory);
  });

  app.use("/api/devices", devicesRouter);

  // Anything else under /api is a 404 — never the SPA shell.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  app.use(errorHandler);

  return app;
}
