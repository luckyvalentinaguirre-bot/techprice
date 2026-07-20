import type { FastifyInstance } from "fastify";
import { isCategory } from "@techprice/shared";
import { getProductCard, listProducts } from "../services/productService.js";

interface ListQuery {
  category?: string;
  search?: string;
  storeId?: string;
  page?: string;
  pageSize?: string;
}

export async function productRoutes(app: FastifyInstance) {
  app.get<{ Querystring: ListQuery }>("/api/products", async (request, reply) => {
    const { category, search, storeId } = request.query;

    if (category && !isCategory(category)) {
      return reply.status(400).send({ error: `Unknown category "${category}"` });
    }

    const page = Math.max(1, parseInt(request.query.page ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? "24", 10) || 24));

    const result = await listProducts({
      category: category && isCategory(category) ? category : undefined,
      search,
      storeId,
      page,
      pageSize,
    });

    return result;
  });

  app.get<{ Params: { id: string } }>("/api/products/:id", async (request, reply) => {
    const card = await getProductCard(request.params.id);
    if (!card) {
      return reply.status(404).send({ error: "Product not found" });
    }
    return card;
  });
}
