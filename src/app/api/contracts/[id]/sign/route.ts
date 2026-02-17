
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        const { signatureImage } = body;

        if (!signatureImage) {
            return NextResponse.json({ error: "Signature image is required" }, { status: 400 });
        }

        // Verify contract belongs to tenant
        const contract = await prisma.contract.findUnique({
            where: { id },
            include: { roomTenant: true },
        });

        if (!contract) {
            return NextResponse.json({ error: "Contract not found" }, { status: 404 });
        }

        // Check if user matches tenant
        // Note: session.user.id is Tenant ID for tenant login (as per my auth implementation)
        const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.id } // This assumes session.user.id IS the tenant ID
        });

        if (!tenant) {
            // Fallback: Check if it's a landlord signing? No, this endpoint is for tenants.
            return NextResponse.json({ error: "Unauthorized. Tenant account required." }, { status: 403 });
        }

        if (contract.roomTenant.tenantId !== tenant.id) {
            return NextResponse.json({ error: "Unauthorized. You are not the tenant of this contract." }, { status: 403 });
        }

        // Update contract
        await prisma.contract.update({
            where: { id },
            data: {
                status: "SIGNED",
                signatureImage,
                signedAt: new Date(),
                tenantSignature: tenant.name, // Also save typed name as signature text
            },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error signing contract:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
