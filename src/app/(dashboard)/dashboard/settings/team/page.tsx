import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Lock, Shield, Plus, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TeamPage() {
    const session = await auth();
    if (!session?.user) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true, name: true, email: true, avatar: true },
    });

    if (!user) return null;

    const isBusiness = user.plan === "BUSINESS";

    if (!isBusiness) {
        return (
            <DashboardShell>
                <PageHeader
                    title="Quản lý nhân viên"
                    description="Phân quyền và quản lý đội ngũ vận hành"
                />
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-muted/20 rounded-xl border-2 border-dashed">
                    <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
                        <Lock className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Tính năng dành riêng cho gói Business</h2>
                    <p className="text-muted-foreground max-w-md mb-8">
                        Nâng cấp lên gói Business để thêm nhân viên, phân quyền quản lý và theo dõi hiệu suất làm việc của đội ngũ.
                    </p>
                    <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                        <Link href="/dashboard/subscription">
                            <Shield className="mr-2 h-5 w-5" />
                            Nâng cấp gói Business
                        </Link>
                    </Button>
                </div>
            </DashboardShell>
        );
    }

    // Mock data for Business plan users
    const teamMembers = [
        {
            id: 1,
            name: user.name,
            email: user.email,
            role: "Owner",
            avatar: user.avatar,
            status: "Active"
        },
        {
            id: 2,
            name: "Nguyễn Văn Management",
            email: "manager@example.com",
            role: "Quản lý",
            avatar: null,
            status: "Active"
        },
        {
            id: 3,
            name: "Trần Thị Support",
            email: "support@example.com",
            role: "CSKH",
            avatar: null,
            status: "Invited"
        }
    ];

    return (
        <DashboardShell>
            <div className="flex justify-between items-center mb-6">
                <PageHeader
                    title="Quản lý nhân viên"
                    description="Phân quyền và quản lý đội ngũ vận hành"
                />
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm nhân viên
                </Button>
            </div>

            <div className="grid gap-6">
                {teamMembers.map((member) => (
                    <Card key={member.id} className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={member.avatar || ""} />
                                <AvatarFallback>{member.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-bold text-lg">{member.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{member.email}</span>
                                    <span>•</span>
                                    <Badge variant={member.role === "Owner" ? "default" : "secondary"}>
                                        {member.role}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant={member.status === "Active" ? "outline" : "secondary"} className={member.status === "Active" ? "text-green-600 border-green-600" : ""}>
                                {member.status === "Active" ? "Đang hoạt động" : "Đã mời"}
                            </Badge>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                    <h4 className="font-bold text-blue-700 dark:text-blue-400">Bảo mật & Quyền hạn</h4>
                    <p className="text-blue-600/80 dark:text-blue-400/80 mt-1">
                        Chủ sở hữu (Owner) có toàn quyền truy cập. Nhân viên quản lý chỉ có thể xem và chỉnh sửa các tòa nhà được phân công.
                    </p>
                </div>
            </div>
        </DashboardShell>
    );
}
