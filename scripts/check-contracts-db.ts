
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const templates = await prisma.contractTemplate.findMany();
    const tenants = await prisma.tenant.findMany();
    const rooms = await prisma.room.findMany({ include: { property: true } });
    const contracts = await prisma.contract.findMany();

    console.log('--- Templates ---');
    console.log(JSON.stringify(templates, null, 2));
    console.log('--- Tenants ---');
    console.log(JSON.stringify(tenants, null, 2));
    console.log('--- Rooms ---');
    console.log(JSON.stringify(rooms, null, 2));
    console.log('--- Contracts ---');
    console.log(JSON.stringify(contracts, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
