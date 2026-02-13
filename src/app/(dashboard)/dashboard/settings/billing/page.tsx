
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { BillingForm } from "./billing-form";

export default async function BillingSettingsPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            bankName: true,
            bankAccountNumber: true,
            bankAccountName: true,
        },
    });

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Thông tin thanh toán</h3>
                <p className="text-sm text-muted-foreground">
                    Cấu hình thông tin ngân hàng để nhận thanh toán qua QR.
                </p>
            </div>
            <Separator />
            <BillingForm initialData={{
                bankName: user.bankName || "",
                bankAccountNumber: user.bankAccountNumber || "",
                bankAccountName: user.bankAccountName || "",
            }} />
        </div>
    );
}
