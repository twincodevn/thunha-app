import { prisma } from "./src/lib/prisma";

async function main() {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const property = await tx.property.create({
                data: {
                    userId: "test-user-id",
                    name: "Test Prop",
                    address: "Chưa cập nhật",
                    electricityRate: 3500,
                    waterRate: 20000,
                },
            });
            const room = await tx.room.create({
                data: {
                    propertyId: property.id,
                    roomNumber: "01",
                    baseRent: 3000000,
                    area: 20,
                    status: "OCCUPIED",
                },
            });
            const tenant = await tx.tenant.create({
                data: {
                    userId: "test-user-id",
                    name: "Test Tenant",
                    phone: "",
                },
            });
            const roomTenant = await tx.roomTenant.create({
                data: {
                    roomId: room.id,
                    tenantId: tenant.id,
                    startDate: new Date(),
                },
            });
            return { property, room, tenant, roomTenant };
        });
        console.log("Success:", result.tenant.id);
    } catch (e: any) {
        console.error("Prisma Error:", e);
    }
}

main().finally(() => process.exit(0));
