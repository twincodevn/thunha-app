const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("Recent payments:");
  console.log(payments);
  
  // also check Vercel env
  console.log("SEPAY_API_KEY built in:", process.env.SEPAY_API_KEY ? "YES" : "NO");
}

main().catch(console.error).finally(()=> prisma.$disconnect());
