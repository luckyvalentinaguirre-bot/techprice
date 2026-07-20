import type { FastifyInstance } from "fastify";
import { prisma } from "@techprice/database";

export async function storeRoutes(app: FastifyInstance) {
  app.get("/api/stores", async () => {
    return prisma.store.findMany({
      where: { enabled: true },
      select: { id: true, name: true, baseUrl: true, platform: true },
      orderBy: { name: "asc" },
    });
  });
}
