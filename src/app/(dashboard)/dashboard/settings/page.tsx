import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { User, CreditCard, Bell, Shield, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PLAN_LIMITS } from "@/lib/constants";
import { saveBankAccount } from "./actions";

async function getUser(userId: string) {
    const [user, roomCount] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                plan: true,
                maxRooms: true,
                createdAt: true,
                bankName: true,
                bankAccountNumber: true,
                bankAccountName: true,
                _count: { select: { properties: true, tenants: true } },
            },
        }),
        prisma.room.count({
            where: { property: { userId } },
        }),
    ]);
    return user ? { ...user, roomCount } : null;
}

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user) return null;

    const user = await getUser(session.user.id);
    if (!user) return null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
                <p className="text-muted-foreground">Quản lý tài khoản và tùy chọn của bạn</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    {/* Profile */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Thông tin cá nhân
                            </CardTitle>
                            <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Họ và tên</Label>
                                    <Input id="name" defaultValue={user.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Số điện thoại</Label>
                                    <Input id="phone" defaultValue={user.phone || ""} placeholder="0912345678" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" defaultValue={user.email || ""} disabled />
                                <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
                            </div>
                            <Button>Lưu thay đổi</Button>
                        </CardContent>
                    </Card>

                    {/* Security */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Bảo mật
                            </CardTitle>
                            <CardDescription>Quản lý mật khẩu và bảo mật tài khoản</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                                <Input id="currentPassword" type="password" />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                                    <Input id="newPassword" type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                                    <Input id="confirmPassword" type="password" />
                                </div>
                            </div>
                            <Button>Đổi mật khẩu</Button>
                        </CardContent>
                    </Card>

                    {/* Bank Account for QR Payment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <QrCode className="h-5 w-5" />
                                Tài khoản nhận tiền
                            </CardTitle>
                            <CardDescription>
                                Cấu hình tài khoản ngân hàng để hiển thị QR thanh toán trên hóa đơn
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={saveBankAccount} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bankName">Ngân hàng</Label>
                                    <select
                                        id="bankName"
                                        name="bankName"
                                        defaultValue={user.bankName || ""}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="">Chọn ngân hàng</option>
                                        <option value="VIETCOMBANK">Vietcombank</option>
                                        <option value="VIETINBANK">VietinBank</option>
                                        <option value="BIDV">BIDV</option>
                                        <option value="AGRIBANK">Agribank</option>
                                        <option value="TECHCOMBANK">Techcombank</option>
                                        <option value="MBBANK">MB Bank</option>
                                        <option value="ACB">ACB</option>
                                        <option value="VPBANK">VPBank</option>
                                        <option value="TPBANK">TPBank</option>
                                        <option value="SACOMBANK">Sacombank</option>
                                        <option value="HDBANK">HDBank</option>
                                        <option value="OCB">OCB</option>
                                        <option value="SHB">SHB</option>
                                        <option value="LPBANK">LPBank (LienVietPostBank)</option>
                                        <option value="VIB">VIB</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bankAccountNumber">Số tài khoản</Label>
                                    <Input
                                        id="bankAccountNumber"
                                        name="bankAccountNumber"
                                        defaultValue={user.bankAccountNumber || ""}
                                        placeholder="1234567890"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bankAccountName">Tên chủ tài khoản</Label>
                                    <Input
                                        id="bankAccountName"
                                        name="bankAccountName"
                                        defaultValue={user.bankAccountName || ""}
                                        placeholder="NGUYEN VAN A"
                                        className="uppercase"
                                    />
                                    <p className="text-xs text-muted-foreground">Tên không dấu, in hoa</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                                    <p className="font-medium">💡 Mẹo:</p>
                                    <p>Sau khi lưu, QR code thanh toán sẽ tự động hiển thị trên hóa đơn gửi cho khách thuê.</p>
                                </div>
                                <Button type="submit">Lưu tài khoản</Button>
                            </form>
                        </CardContent>
                    </Card>
                    {/* Notifications */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Thông báo
                            </CardTitle>
                            <CardDescription>Cấu hình thông báo email và SMS</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Email nhắc nợ</p>
                                        <p className="text-sm text-muted-foreground">Gửi email khi hóa đơn quá hạn</p>
                                    </div>
                                    <Badge variant="secondary">Sắp ra mắt</Badge>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Báo cáo hàng tháng</p>
                                        <p className="text-sm text-muted-foreground">Nhận tổng kết doanh thu hàng tháng</p>
                                    </div>
                                    <Badge variant="secondary">Sắp ra mắt</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Plan */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Gói hiện tại
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold">{user.plan}</span>
                                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600">
                                    {PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] === Infinity ? "Không giới hạn" : `${PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS]} phòng`}
                                </Badge>
                            </div>

                            {/* Room Usage Progress */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Phòng đã dùng</span>
                                    <span className="font-medium">
                                        {user.roomCount} / {PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] === Infinity ? "∞" : PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS]}
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${user.roomCount >= (PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] === Infinity ? 999 : PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS])
                                            ? "bg-red-500"
                                            : user.roomCount >= (PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] === Infinity ? 999 : PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] * 0.8)
                                                ? "bg-yellow-500"
                                                : "bg-blue-600"
                                            }`}
                                        style={{
                                            width: `${Math.min(100, (user.roomCount / (PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] === Infinity ? 999 : PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS])) * 100)}%`
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="text-sm space-y-1">
                                <p>✓ {user._count.properties} tòa nhà đã tạo</p>
                                <p>✓ {user._count.tenants} khách thuê</p>
                            </div>
                            {user.plan === "FREE" && (
                                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600" asChild>
                                    <Link href="/pricing">Nâng cấp</Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Account Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin tài khoản</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Ngày tạo</span>
                                <span>{new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">ID</span>
                                <span className="font-mono text-xs">{user.id.slice(0, 8)}...</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
