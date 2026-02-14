
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const bills = await prisma.bill.findMany({
        where: {
            invoice: null
        }
    });

    console.log(`Found ${bills.length} bills without invoices.`);

    for (const bill of bills) {
        await prisma.invoice.create({
            data: {
                billId: bill.id,
                token: `tok_${bill.id.slice(-8)}`
            }
        });
        console.log(`Created invoice for bill ${bill.id}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
