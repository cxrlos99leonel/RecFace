import { defineEventHandler } from "h3";

export default defineEventHandler(() => ({
  status: "running",
  version: "2.1.0",
  timestamp: new Date().toISOString(),
}));
