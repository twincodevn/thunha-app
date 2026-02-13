
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Testing database connection...");
    try {
        const userCount = await prisma.user.count();
        console.log(`Successfully connected! Found ${userCount} users.`);

        // Try to find the landlord to verify data integrity
        const landlord = await prisma.user.findFirst({
            where: { email: "landlord@example.com" }
        });
        console.log("Landlord found:", landlord ? "Yes" : "No");

    } catch (error) {
        console.error("Database connection failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
