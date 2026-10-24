import { z } from "zod";
import { HistoryPointSchema } from "../../shared/schemas/history";
import { readSeedFile } from "./readSeedFile";

const raw: unknown = readSeedFile("status-history.json");

export const seededHistory = z.array(HistoryPointSchema).parse(raw);
