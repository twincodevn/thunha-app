import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all bills for this user
        const bills = await prisma.bill.findMany({
            where: {
                roomTenant: { room: { property: { userId: session.user.id } } },
            },
            include: {
                roomTenant: {
                    include: {
                        room: { include: { property: true } },
                        tenant: true,
                    },
                },
            },
            orderBy: [
                { year: "desc" },
                { month: "desc" },
                { createdAt: "desc" },
            ],
        });

        // Build CSV content
        const headers = [
            "Tháng/Năm",
            "Tòa nhà",
            "Số phòng",
            "Khách thuê",
            "Số điện thoại",
            "Tiền phòng",
            "Tiền điện (kWh)",
            "Tiền điện (VND)",
            "Tiền nước (m³)",
            "Tiền nước (VND)",
            "Giảm giá",
            "Tổng cộng",
            "Trạng thái",
            "Hạn thanh toán",
            "Ngày tạo",
        ];

        const rows = bills.map((bill) => [
            `${bill.month}/${bill.year}`,
            bill.roomTenant.room.property.name,
            bill.roomTenant.room.roomNumber,
            bill.roomTenant.tenant.name,
            bill.roomTenant.tenant.phone || "",
            bill.baseRent,
            bill.electricityUsage,
            bill.electricityAmount,
            bill.waterUsage,
            bill.waterAmount,
            bill.discount,
            bill.total,
            getStatusLabel(bill.status),
            formatDate(bill.dueDate),
            formatDate(bill.createdAt),
        ]);

        // Add BOM for Excel UTF-8 compatibility
        const BOM = "\uFEFF";
        const csvContent = BOM + [
            headers.join(","),
            ...rows.map((row) =>
                row.map((cell) => {
                    const str = String(cell);
                    // Escape quotes and wrap in quotes if contains comma or quote
                    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                }).join(",")
            ),
        ].join("\n");

        // Return CSV file
        const fileName = `hoa-don-${new Date().toISOString().split("T")[0]}.csv`;
        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error("Export CSV error:", error);
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
    }
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        DRAFT: "Nháp",
        PENDING: "Chờ thanh toán",
        PAID: "Đã thanh toán",
        OVERDUE: "Quá hạn",
        CANCELLED: "Đã hủy",
    };
    return labels[status] || status;
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("vi-VN");
}
