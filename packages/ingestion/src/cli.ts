import { prisma } from "@techprice/database";
import { runIngestion } from "./pipeline.js";

async function main() {
  // Optional: `pnpm ingest -- store-id-1 store-id-2` to limit the run.
  const storeIds = process.argv.slice(2).filter(Boolean);
  const summaries = await runIngestion(storeIds.length > 0 ? storeIds : undefined);

  console.table(summaries);

  const hadErrors = summaries.some((s) => s.errors > 0);
  if (hadErrors) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error("[ingestion] fatal error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
