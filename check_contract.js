const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking contract...");
  const contract = await prisma.contract.findUnique({
    where: { id: "cmmaw6zk20007kz04vutby2pw" }
  });
  console.log("Result:");
  console.log(contract);
  
  if (!contract) {
    // try to find by token or other
    console.log("Checking if ID is actually a room tenant ID");
    const rt = await prisma.roomTenant.findUnique({ where: { id: "cmmaw6zk20007kz04vutby2pw"} , include: { contract: true }});
    console.log("RoomTenant found?", rt ? "Yes" : "No");
    if (rt && rt.contract) console.log("Real contract ID is:", rt.contract.id);
  }
}

main().catch(console.error).finally(()=> prisma.$disconnect());
