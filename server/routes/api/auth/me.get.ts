import { defineEventHandler } from "h3";
import { requireAdmin } from "../../../lib/auth";

export default defineEventHandler((event) => {
  const { email } = requireAdmin(event);
  return { email };
});
