const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const tenantCount = await prisma.tenant.count();
  console.log(`Users: ${userCount}, Tenants: ${tenantCount}`);

  const usersWithAvatars = await prisma.user.findMany({
    select: { id: true, name: true, avatar: true }
  });
  
  usersWithAvatars.forEach(u => {
    if (u.avatar) {
      console.log(`User ${u.id} (${u.name}): Avatar length ${u.avatar.length}`);
      if (u.avatar.length > 500) {
          console.log(`  PREFIX: ${u.avatar.substring(0, 50)}`);
      }
    } else {
      console.log(`User ${u.id} (${u.name}): No avatar`);
    }
  });
}

main().catch(console.error).finally(()=> prisma.$disconnect());
