import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken, sendZNS, formatVietnamesePhone } from "@/lib/zalo";

/**
 * POST /api/zalo/send-test
 * Gửi ZNS test từ trang settings — dùng template BILL_CREATED làm demo
 * Body: { phone: string, templateId?: string }
 */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, templateId } = await req.json();

    if (!phone) {
        return NextResponse.json({ error: "Số điện thoại không được để trống" }, { status: 400 });
    }

    const accessToken = await getValidAccessToken(session.user.id);

    // Nếu không có token → sandbox mode
    const isConnected = !!accessToken;
    const token = accessToken || "sandbox";

    const result = await sendZNS(
        token,
        phone,
        templateId || process.env.ZALO_TEMPLATE_BILL_CREATED || "",
        {
            tenant_name: "Khách thuê Test",
            room_number: "101",
            property_name: "Nhà trọ Demo",
            month: "Tháng 2/2026",
            amount: "2.500.000 đ",
            due_date: "15/03/2026",
            invoice_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/demo`,
        },
        `test-${Date.now()}`
    );

    return NextResponse.json({
        ...result,
        phone: formatVietnamesePhone(phone),
        sandboxMode: !isConnected,
    });
}

/**
 * DELETE /api/zalo/send-test (dùng làm disconnect)
 */
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            zaloOaAccessToken: null,
            zaloOaRefreshToken: null,
            zaloOaTokenExpiry: null,
            zaloOaId: null,
        },
    });

    return NextResponse.json({ success: true, message: "Đã ngắt kết nối Zalo OA" });
}
