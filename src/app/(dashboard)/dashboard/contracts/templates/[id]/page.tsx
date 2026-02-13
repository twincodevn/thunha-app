
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash } from "lucide-react";
import Link from "next/link";
import { ContractTemplateForm } from "@/components/contracts/contract-template-form";

export default async function ContractTemplateDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { id } = await params;
    const template = await prisma.contractTemplate.findUnique({
        where: { id, userId: session.user.id },
    });

    if (!template) notFound();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/contracts/templates">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa mẫu hợp đồng</h1>
                </div>
            </div>

            <ContractTemplateForm template={template} />
        </div>
    );
}
