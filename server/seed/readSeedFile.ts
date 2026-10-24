import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * The seed files are read from disk at startup instead of being imported.
 * Importing JSON would tie the data to the bundler, and reading keeps the
 * "the file on disk is the truth" property: replace the file, restart, done.
 *
 * The lookup starts at the working directory (the project root, where the
 * server is started) and walks up one level, so the server also runs when it
 * is started from a subdirectory.
 */
export function readSeedFile(fileName: string): unknown {
  const candidates = [
    path.resolve(process.cwd(), fileName),
    path.resolve(process.cwd(), "..", fileName),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return JSON.parse(readFileSync(candidate, "utf8"));
    }
  }

  throw new Error(
    `Could not find "${fileName}". Looked in:\n${candidates.map((entry) => `  - ${entry}`).join("\n")}`,
  );
}
