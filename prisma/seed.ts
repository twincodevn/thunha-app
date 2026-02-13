
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Start seeding ...");

    // Clean up existing data
    // Note: Delete in order of dependencies if cascade is not perfect, but with Cascade it should be fine.
    // Using $transaction to ensure atomicity.
    await prisma.$transaction([
        prisma.payment.deleteMany(),
        prisma.invoice.deleteMany(),
        prisma.bill.deleteMany(),
        prisma.meterReading.deleteMany(),
        prisma.incident.deleteMany(),
        prisma.roomTenant.deleteMany(),
        prisma.tenant.deleteMany(),
        prisma.asset.deleteMany(),
        prisma.room.deleteMany(),
        prisma.property.deleteMany(),
        prisma.user.deleteMany(),
    ]);

    // Create Landlord
    const password = await hash("password123", 12);
    const landlord = await prisma.user.create({
        data: {
            email: "landlord@example.com",
            name: "Chủ Trọ Demo",
            password,
            plan: "PRO",
            bankName: "MB",
            bankAccountNumber: "0919021215",
            bankAccountName: "NGUYEN VAN A",
        },
    });

    // Create Property
    const property = await prisma.property.create({
        data: {
            userId: landlord.id,
            name: "Chung cư Mini Xanh",
            address: "123 Đường Láng, Hà Nội",
            electricityRate: 3500,
            waterRate: 20000,
        },
    });

    // Create Rooms
    const room101 = await prisma.room.create({
        data: {
            propertyId: property.id,
            roomNumber: "101",
            floor: 1,
            baseRent: 3500000,
            area: 25,
            status: "OCCUPIED",
        },
    });

    const room102 = await prisma.room.create({
        data: {
            propertyId: property.id,
            roomNumber: "102",
            floor: 1,
            baseRent: 3800000,
            area: 28,
            status: "VACANT",
        },
    });

    // Create Tenant (with Auth)
    const tenantPass = await hash("tenant123", 12);
    const tenant = await prisma.tenant.create({
        data: {
            userId: landlord.id,
            name: "Nguyen Van Khach",
            phone: "0987654321",
            email: "tenant@example.com",
            username: "tenant1",
            password: tenantPass,
        },
    });

    // Assign Tenant to Room 101
    const roomTenant = await prisma.roomTenant.create({
        data: {
            roomId: room101.id,
            tenantId: tenant.id,
            startDate: new Date(),
        },
    });

    // Create a pending bill for testing
    const bill = await prisma.bill.create({
        data: {
            roomTenantId: roomTenant.id,
            month: 12, // Future
            year: 2026,
            baseRent: room101.baseRent,
            electricityUsage: 15,
            electricityAmount: 15 * property.electricityRate,
            waterUsage: 4,
            waterAmount: 4 * property.waterRate,
            total: room101.baseRent + (15 * property.electricityRate) + (4 * property.waterRate),
            status: "PENDING",
            dueDate: new Date(2026, 11, 20),
        },
    });

    // Create Invoice for the bill
    await prisma.invoice.create({
        data: {
            billId: bill.id,
        },
    });

    console.log("Seeding finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
