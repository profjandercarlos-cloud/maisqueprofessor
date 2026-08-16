import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Conexão via pooler (pgbouncer, porta 6543) — necessária em runtime serverless
// (Vercel), onde cada invocação pode abrir sua própria conexão. Migrations usam
// DATABASE_URL (conexão direta) via prisma.config.ts, não este arquivo.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
