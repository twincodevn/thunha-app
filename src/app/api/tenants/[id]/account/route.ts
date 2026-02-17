
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const accountSchema = z.object({
    username: z.string().min(3, "Username phải có ít nhất 3 ký tự"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validated = accountSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation error", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const { username, password } = validated.data;

        // Check ownership
        const tenant = await prisma.tenant.findUnique({
            where: { id },
        });

        if (!tenant || tenant.userId !== session.user.id) {
            return NextResponse.json({ error: "Tenant not found or unauthorized" }, { status: 404 });
        }

        // Check if username is taken by another tenant
        const existingUsername = await prisma.tenant.findFirst({
            where: {
                username,
                id: { not: id }, // Exclude current tenant
            },
        });

        if (existingUsername) {
            return NextResponse.json(
                { error: "Username đã tồn tại. Vui lòng chọn tên khác." },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await hash(password, 12);

        // Update tenant account
        const updatedTenant = await prisma.tenant.update({
            where: { id },
            data: {
                username,
                password: hashedPassword,
            },
        });

        return NextResponse.json({
            success: true,
            tenant: {
                id: updatedTenant.id,
                username: updatedTenant.username,
                name: updatedTenant.name,
            },
        });

    } catch (error) {
        console.error("Error creating tenant account:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
