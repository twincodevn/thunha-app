const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { avatar: { not: null } },
    select: { id: true, avatar: true }
  });
  
  console.log("Avatar sizes:");
  users.forEach(u => {
    console.log(`User ${u.id}: ${u.avatar.length} chars`);
    if (u.avatar.startsWith('data:')) {
      console.log(`  (Base64 detected)`);
    } else {
      console.log(`  (URL detected: ${u.avatar.substring(0, 30)}...)`);
    }
  });
}

main().catch(console.error).finally(()=> prisma.$disconnect());
