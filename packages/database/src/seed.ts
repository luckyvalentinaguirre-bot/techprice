import { STORE_CONFIGS } from "@techprice/scrapers";
import { prisma } from "./client.js";

async function main() {
  for (const store of STORE_CONFIGS) {
    await prisma.store.upsert({
      where: { id: store.id },
      create: {
        id: store.id,
        name: store.name,
        baseUrl: store.baseUrl,
        platform: store.platform,
        enabled: store.enabled,
      },
      update: {
        name: store.name,
        baseUrl: store.baseUrl,
        platform: store.platform,
        enabled: store.enabled,
      },
    });
    console.log(`seeded store: ${store.id}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
