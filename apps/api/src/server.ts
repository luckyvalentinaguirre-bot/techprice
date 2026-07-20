import cors from "@fastify/cors";
import Fastify from "fastify";
import { categoryRoutes } from "./routes/categories.js";
import { productRoutes } from "./routes/products.js";
import { storeRoutes } from "./routes/stores.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.API_CORS_ORIGIN?.split(",") ?? "*",
});

app.get("/health", async () => ({ status: "ok" }));

await app.register(categoryRoutes);
await app.register(storeRoutes);
await app.register(productRoutes);

// Most PaaS providers (Render, Railway, Heroku) inject PORT; API_PORT stays
// as the override for local dev via .env.
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
app
  .listen({ port, host: "0.0.0.0" })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
