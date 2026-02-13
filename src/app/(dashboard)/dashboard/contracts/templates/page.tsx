
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export const metadata = {
    title: "Mẫu Hợp đồng | ThuNhà",
    description: "Quản lý các mẫu hợp đồng thuê nhà",
};

export default async function ContractTemplatesPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const templates = await prisma.contractTemplate.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { contracts: true } } },
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mẫu Hợp đồng</h1>
                    <p className="text-muted-foreground">
                        Tạo và quản lý các mẫu hợp đồng để tái sử dụng.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/contracts/templates/new">
                        <Plus className="mr-2 h-4 w-4" /> Tạo mẫu mới
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                    <div
                        key={template.id}
                        className="group relative flex flex-col justify-between rounded-lg border p-6 hover:shadow-md transition-shadow bg-white"
                    >
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <FileText className="h-6 w-6" />
                                </div>
                                {template.isActive ? (
                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 text-green-800">
                                        Đang dùng
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-100 text-gray-800">
                                        Đã ẩn
                                    </span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                                    {template.name}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {template._count.contracts} hợp đồng đã tạo
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex items-center text-xs text-muted-foreground">
                            <Calendar className="mr-2 h-3 w-3" />
                            Cập nhật {format(template.updatedAt, "dd/MM/yyyy", { locale: vi })}
                        </div>
                        <Link
                            href={`/dashboard/contracts/templates/${template.id}`}
                            className="absolute inset-0"
                        >
                            <span className="sr-only">Xem chi tiết</span>
                        </Link>
                    </div>
                ))}
            </div>

            {templates.length === 0 && (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
                        <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">Chưa có mẫu hợp đồng nào</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                        Bắt đầu bằng việc tạo mẫu hợp đồng đầu tiên để áp dụng cho khách thuê.
                    </p>
                    <Button asChild>
                        <Link href="/dashboard/contracts/templates/new">
                            <Plus className="mr-2 h-4 w-4" /> Tạo mẫu ngay
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
