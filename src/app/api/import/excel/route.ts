import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { read, utils } from "xlsx";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const propertyId = formData.get("propertyId") as string;
        const file = formData.get("file") as File;

        if (!propertyId || !file) {
            return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
        }

        const property = await prisma.property.findUnique({
            where: { id: propertyId, userId: session.user.id }
        });

        if (!property) {
            return NextResponse.json({ error: "Không tìm thấy nhà/khu trọ" }, { status: 404 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = utils.sheet_to_json<any>(worksheet);

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: "File Excel trống" }, { status: 400 });
        }

        let importCount = 0;

        await prisma.$transaction(async (tx) => {
            for (const row of rows) {
                if (!row['Tên phòng'] || !row['Giá thuê']) continue;

                // Create or fetch the room
                const roomNumber = row['Tên phòng'].toString();
                let room = await tx.room.findFirst({
                    where: { propertyId, roomNumber }
                });

                if (!room) {
                    room = await tx.room.create({
                        data: {
                            propertyId,
                            roomNumber,
                            baseRent: Number(row['Giá thuê']),
                            deposit: Number(row['Tiền cọc'] || 0),
                            area: Number(row['Diện tích'] || 0),
                            status: row['Tên khách'] ? 'OCCUPIED' : 'VACANT',
                        }
                    });
                }

                // If there's a tenant associated
                if (row['Tên khách'] && row['SĐT']) {
                    const phone = row['SĐT'].toString();

                    let tenant = await tx.tenant.findFirst({
                        where: { userId: session.user.id, phone }
                    });

                    if (!tenant) {
                        tenant = await tx.tenant.create({
                            data: {
                                userId: session.user.id,
                                name: row['Tên khách'].toString(),
                                phone,
                                creditScore: 600,
                            }
                        });
                    }

                    // Assign to room if not already
                    const existingAssignment = await tx.roomTenant.findFirst({
                        where: { roomId: room.id, tenantId: tenant.id, isActive: true }
                    });

                    if (!existingAssignment) {
                        await tx.roomTenant.create({
                            data: {
                                roomId: room.id,
                                tenantId: tenant.id,
                                startDate: new Date(),
                            }
                        });

                        await tx.room.update({
                            where: { id: room.id },
                            data: { status: 'OCCUPIED' }
                        });
                    }
                }

                importCount++;
            }
        });

        return NextResponse.json({ success: true, count: importCount });
    } catch (error: any) {
        console.error("EXCEL_IMPORT_ERROR", error);
        return NextResponse.json(
            { error: "Đã xảy ra lỗi khi nhập dữ liệu: " + error?.message },
            { status: 500 }
        );
    }
}
