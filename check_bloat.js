const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking User bloat...");
  const users = await prisma.user.findMany();
  users.forEach(u => {
    for (const [key, val] of Object.entries(u)) {
      if (typeof val === 'string' && val.length > 1000) {
        console.log(`User ${u.id} - Field ${key} is large: ${val.length} chars`);
      }
    }
  });

  console.log("Checking Tenant bloat...");
  const tenants = await prisma.tenant.findMany();
  tenants.forEach(t => {
    for (const [key, val] of Object.entries(t)) {
      const size = typeof val === 'string' ? val.length : (val ? JSON.stringify(val).length : 0);
      if (size > 1000) {
        console.log(`Tenant ${t.id} - Field ${key} is large: ${size} chars`);
      }
    }
  });
}

main().catch(console.error).finally(()=> prisma.$disconnect());
