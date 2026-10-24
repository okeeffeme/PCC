import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vite-plus/test";
import { resetDevices, server } from "./server";

beforeAll(() =>
  server.listen({
    // Only the API is mocked. Requests to anything else (the Express API tests
    // hitting a real port) are left alone, so a wrong URL still fails loudly.
    onUnhandledFrame({ frame, defaults }) {
      if (frame.protocol !== "http") return;

      const request = (frame.data as { request?: Request }).request;
      if (!request) return;

      const url = new URL(request.url);
      const isSameOrigin = url.origin === window.location.origin;

      // An API call the app made but no handler covered is a bug in the test.
      if (isSameOrigin && url.pathname.startsWith("/api")) {
        defaults.error();
      }
      // Anything else (the Express API tests, which talk to a real port) is
      // left to the network on purpose.
    },
  }),
);

afterEach(() => {
  // Vitest runs with `globals: false`, so Testing Library cannot register its
  // own automatic cleanup.
  cleanup();
  server.resetHandlers();
  resetDevices();
  // Filters/pagination/sort live in the URL, so the URL is state too.
  window.history.replaceState(null, "", "/");
});

afterAll(() => server.close());
