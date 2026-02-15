"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * MISA-compatible accounting export
 * Generates data in a format that can be imported to MISA SME or MISA AMIS
 */
export async function exportMISAFormat(year: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;

    const paidBills = await prisma.bill.findMany({
        where: {
            year,
            status: "PAID",
            roomTenant: { room: { property: { userId } } },
        },
        include: {
            roomTenant: {
                include: {
                    tenant: { select: { name: true, phone: true } },
                    room: { select: { roomNumber: true, property: { select: { name: true } } } },
                },
            },
            payments: { orderBy: { paidAt: "asc" }, take: 1 },
        },
        orderBy: [{ month: "asc" }],
    });

    const incidents = await prisma.incident.findMany({
        where: {
            property: { userId },
            createdAt: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) },
            cost: { gt: 0 },
        },
        select: { title: true, cost: true, createdAt: true },
        orderBy: { createdAt: "asc" },
    });

    // MISA CSV format
    const header = [
        "Ngày chứng từ", "Số chứng từ", "Diễn giải",
        "TK Nợ", "TK Có", "Số tiền", "Đối tượng", "Ghi chú",
    ].join(",");

    const incomeRows = paidBills.map((b, idx) => {
        const paidDate = b.payments[0]?.paidAt
            ? new Date(b.payments[0].paidAt).toLocaleDateString("vi-VN")
            : `01/${String(b.month).padStart(2, "0")}/${b.year}`;
        const voucherNo = `PT${String(idx + 1).padStart(4, "0")}`;
        const desc = `Thu tiền phòng ${b.roomTenant.room.roomNumber} T${b.month}/${b.year}`;
        const tenant = b.roomTenant.tenant.name;

        return [
            paidDate,
            voucherNo,
            desc,
            "1111", // TK Tiền mặt or 1121 for bank
            "5113", // TK Doanh thu cho thuê
            b.total,
            tenant,
            `P.${b.roomTenant.room.roomNumber} - ${b.roomTenant.room.property.name}`,
        ].join(",");
    });

    const expenseRows = incidents.map((inc, idx) => {
        const date = new Date(inc.createdAt).toLocaleDateString("vi-VN");
        const voucherNo = `PC${String(idx + 1).padStart(4, "0")}`;
        return [
            date,
            voucherNo,
            inc.title,
            "6278", // TK Chi phí sửa chữa
            "1111",
            inc.cost,
            "",
            "Chi phí bảo trì",
        ].join(",");
    });

    return [header, ...incomeRows, ...expenseRows].join("\n");
}
