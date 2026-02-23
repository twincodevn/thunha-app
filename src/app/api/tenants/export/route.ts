import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { format } from "date-fns";

export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const tenants = await prisma.tenant.findMany({
            where: { userId: session.user.id },
            include: {
                roomTenants: {
                    include: {
                        room: {
                            include: {
                                property: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Construct CSV Content
        const headers = [
            "Mã Khách Thuê",
            "Họ và Tên",
            "Số Điện Thoại",
            "Email",
            "Số CCCD",
            "Tòa Nhà",
            "Phòng",
            "Ngày Bắt Đầu Hợp Đồng",
            "Trạng Thái"
        ].join(",");

        const rows = tenants.map(tenant => {
            const activeContract = tenant.roomTenants.find(rt => rt.isActive);
            const propertyName = activeContract?.room.property.name || "N/A";
            const roomNumber = activeContract?.room.roomNumber || "N/A";
            const startDate = activeContract?.startDate ? format(new Date(activeContract.startDate), "yyyy-MM-dd") : "N/A";
            const status = activeContract ? "Đang thuê" : "Đã chuyển đi";

            // Escape quotes inside fields to prevent CSV breaking
            const escape = (str: string | null | undefined) => `"${(str || "").replace(/"/g, '""')}"`;

            return [
                escape(tenant.id.slice(0, 8)),
                escape(tenant.name),
                escape(tenant.phone),
                escape(tenant.email),
                escape(tenant.idNumber),
                escape(propertyName),
                escape(roomNumber),
                escape(startDate),
                escape(status)
            ].join(",");
        });

        const csvContent = [headers, ...rows].join("\n");

        // Force BOM to make Excel decode UTF-8 properly for Vietnamese characters
        const bom = "\uFEFF";

        return new NextResponse(bom + csvContent, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="DanhSachKhachThue_${format(new Date(), "yyyyMMdd")}.csv"`
            }
        });
    } catch (error) {
        console.error("Export error:", error);
        return new NextResponse("Failed to export tenants", { status: 500 });
    }
}
