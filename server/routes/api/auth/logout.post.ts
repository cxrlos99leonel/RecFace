import { defineEventHandler } from "h3";
import { clearSession } from "../../../lib/auth";

export default defineEventHandler((event) => {
  clearSession(event);
  return { success: true };
});
