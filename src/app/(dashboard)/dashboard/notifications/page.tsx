import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export const metadata = {
    title: "Thông báo | ThuNhà",
    description: "Lịch sử thông báo của bạn",
};

export default async function NotificationsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const userId = session.user.id;

    // Fetch all notifications
    const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Thông báo</h1>
                    <p className="text-muted-foreground">
                        Lịch sử hoạt động và thông báo từ hệ thống.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="h-5 w-5" /> Tất cả thông báo ({notifications.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {notifications.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Chưa có thông báo nào.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`flex items-start gap-4 p-4 rounded-lg border ${notif.isRead ? "bg-card" : "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900"
                                        }`}
                                >
                                    <div className={`mt-1 p-2 rounded-full shrink-0 ${notif.isRead ? "bg-muted" : "bg-blue-100 text-blue-600"}`}>
                                        <Bell className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className={`text-sm ${notif.isRead ? "font-medium" : "font-semibold"}`}>
                                                {notif.title}
                                            </h4>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {notif.message}
                                        </p>
                                    </div>
                                    {notif.isRead && <CheckCircle2 className="h-4 w-4 text-muted-foreground opacity-50" />}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
