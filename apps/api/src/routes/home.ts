import type { FastifyInstance } from "fastify";
import { getHomeOverview } from "../services/homeService.js";

export async function homeRoutes(app: FastifyInstance) {
  app.get("/api/home", async () => {
    return getHomeOverview();
  });
}
