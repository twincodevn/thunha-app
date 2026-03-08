import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const contract = await prisma.contract.findUnique({
    where: { id: "cmmaw6zk20007kz04vutby2pw" }
  });
  console.log("Contract:", contract ? "EXISTS" : "NOT FOUND");
}
main().catch(console.error).finally(() => prisma.$disconnect());
