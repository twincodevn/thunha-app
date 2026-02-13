
import { prisma } from "./src/lib/prisma";

async function main() {
    const invoice = await prisma.invoice.findFirst({
        where: {
            bill: {
                status: {
                    in: ["PENDING", "DRAFT"]
                }
            }
        }
    });
    if (invoice) {
        console.log(invoice.token);
    } else {
        console.log("No unpaid invoice found");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
