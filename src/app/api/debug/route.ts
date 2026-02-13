
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        console.log("Checking DB connection...");
        const count = await prisma.user.count();
        console.log("DB connection successful, count:", count);
        return NextResponse.json({ status: "ok", count });
    } catch (error: any) {
        console.error("DB connection failed:", error);
        return NextResponse.json(
            { status: "error", message: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}
