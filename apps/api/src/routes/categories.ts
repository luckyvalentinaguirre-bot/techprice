import type { FastifyInstance } from "fastify";
import { CATEGORIES, CATEGORY_LABELS_ES } from "@techprice/shared";

export async function categoryRoutes(app: FastifyInstance) {
  app.get("/api/categories", async () => {
    return CATEGORIES.map((id) => ({ id, label: CATEGORY_LABELS_ES[id] }));
  });
}
